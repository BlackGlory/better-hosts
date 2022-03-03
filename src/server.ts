import { IServerInfo } from '@utils/parse-server-info'
import * as dns from 'native-node-dns'
import { map } from 'extra-promise'
import { ResourceRecordType } from './resource-record-type'
import { getErrorResultAsync } from 'return-style'
import { Logger } from 'extra-logger'
import { Hosts } from './hosts'
import chalk from 'chalk'
import ms from 'ms'
import { isntUndefined } from '@blackglory/types'
import { go } from '@blackglory/go'

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
    const answers = await map(req.question, async question => {
      logger.trace(`${formatHostname(question.name)} ${ResourceRecordType[question.type]}`)
      const address = go(() => {
        switch (question.type) {
          case ResourceRecordType.A: return hosts.resolveA(question.name)
          case ResourceRecordType.AAAA: return hosts.resolveAAAA(question.name)
        }
      })
      if (isntUndefined(address)) {
        logger.info(`${formatHostname(question.name)} ${address}`)
        return [
          {
            name: question.name
          , type: question.type
          , class: question.class
          , address
          , ttl: 0
          }
        ] as dns.IResourceRecord[]
      }

      const startTime = Date.now()
      const [err, answers] = await getErrorResultAsync(() => resolve(fallbackServer, question))
      if (err) {
        logger.error(`${formatHostname(question.name)} ${err}`, getElapsed(startTime))
        return []
      }

      logger.info(`${formatHostname(question.name)} ${ResourceRecordType[question.type]}`, getElapsed(startTime))
      return answers
    })

    answers
      .flat()
      .forEach(answer => res.answer.push(answer))

    res.send()
  })

  return server.serve(port)
}

function resolve(server: IServerInfo, question: dns.IQuestion): Promise<dns.IResourceRecord[]> {
  return new Promise((resolve, reject) => {
    const answers: dns.IResourceRecord[] = []
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
    request.on('end', () => resolve(answers))
    request.on('message', (err, msg) => {
      if (err) return reject(err)
      msg.answer.forEach(answer => answers.push(answer))
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
