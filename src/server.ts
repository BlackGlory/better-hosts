import { IServerInfo } from '@utils/parse-server-info'
import * as dns from 'native-node-dns'
import { getErrorResultAsync } from 'return-style'
import { Logger } from 'extra-logger'
import { Hosts } from './hosts'
import chalk from 'chalk'
import ms from 'ms'
import { go } from '@blackglory/go'
import { RecordType } from './record-types'

interface IStartServerOptions {
  fallbackServer: IServerInfo
  hosts: Hosts
  logger: Logger
  port: number
}

export function startServer({ logger, port, hosts, fallbackServer }: IStartServerOptions) {
  const server = dns.createServer()

  server.on('error', console.error)
  server.on('socketError', console.error)
  server.on('request', async (req, res) => {
    logger.trace(`request: ${JSON.stringify(req)}`)

    res.header.rcode = dns.consts.NAME_TO_RCODE.SERVFAIL

    const question = req.question[0]
    logger.trace(`${formatHostname(question.name)} ${RecordType[question.type]}`)
    const result = go(() => {
      switch (question.type) {
        case dns.consts.NAME_TO_QTYPE.A: return hosts.resolveA(question.name)
        case dns.consts.NAME_TO_QTYPE.AAAA: return hosts.resolveAAAA(question.name)
      }
    })
    if (result?.hasRecords) {
      if (result.address) {
        logger.info(`${formatHostname(question.name)} ${result.address}`)
        res.header.rcode = dns.consts.NAME_TO_RCODE.NOERROR
        res.answer.push({
          name: question.name
        , type: question.type
        , class: question.class
        , ttl: 0
        , address: result.address
        })
        return sendRes()
      } else {
        logger.info(`${formatHostname(question.name)} No records for ${RecordType[question.type]}`)
        res.header.rcode = dns.consts.NAME_TO_RCODE.NOERROR
        return sendRes()
      }
    }

    const startTime = Date.now()
    const [err, response] = await getErrorResultAsync(() => resolve(fallbackServer, question))
    if (err) {
      logger.error(`${formatHostname(question.name)} ${err}`, getElapsed(startTime))
      return sendRes()
    }
    logger.info(`${formatHostname(question.name)} ${RecordType[question.type]}`, getElapsed(startTime))

    res.header.rcode = response!.header.rcode
    res.answer = response!.answer
    res.authority = response!.authority
    sendRes()

    function sendRes() {
      logger.trace(`response: ${JSON.stringify(res)}`)
      res.send()
    }
  })

  return server.serve(port)
}

function resolve(server: IServerInfo, question: dns.IQuestion): Promise<dns.IPacket> {
  return new Promise((resolve, reject) => {
    let response: dns.IPacket
    const request = dns.Request({
      question
    , server: {
        address: server.host
      , port: server.port
      , type: 'udp'
      }
    , timeout: ms('30s')
    , cache: false
    , try_edns: true
    })

    request.on('timeout', () => reject())
    request.on('cancelled', () => reject())
    request.on('end', () => resolve(response))
    request.on('message', (err, msg) => {
      if (err) return reject(err)
      response = msg
    })

    request.send()
  })
}

function formatHostname(hostname: string): string {
  return chalk.cyan(hostname)
}

function getElapsed(startTime: number): number {
  return Date.now() - startTime
}
