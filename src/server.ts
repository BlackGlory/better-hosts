import { IServerInfo } from '@utils/parse-server-info.js'
import { Logger } from 'extra-logger'
import { Hosts } from './hosts.js'
import chalk from 'chalk'
import { assert, go } from '@blackglory/prelude'
import { DNSClient, DNSServer, IPacket, IQuestion, IResourceRecord, QR, RCODE, TYPE } from 'extra-dns'
import { timeoutSignal } from 'extra-abort'
import { createRDATAForA, createRDATAForAAAA } from '@utils/dns.js'

interface IStartServerOptions {
  fallbackServer: IServerInfo
  timeout: number
  hosts: Hosts
  logger: Logger
  port: number
}

export async function startServer(
  {
    logger
  , timeout
  , port
  , hosts
  , fallbackServer
  }: IStartServerOptions
): Promise<() => Promise<void>> {
  const server = new DNSServer('0.0.0.0', port)
  const client = new DNSClient(fallbackServer.host, fallbackServer.port ?? 53)

  server.on('query', async (query, respond) => {
    logger.trace(`request: ${JSON.stringify(query)}`)

    // 默认失败响应.
    let response: IPacket = {
      header: {
        ID: query.header.ID
      , flags: {
          QR: QR.Response
        , OPCODE: query.header.flags.OPCODE
        , AA: 0
        , TC: 0
        , RD: 0
        , RA: 0
        , Z: 0
        , RCODE: RCODE.ServFail
        }
      }
    , questions: query.questions
    , answers: []
    , authorityRecords: []
    , additionalRecords: []
    }

    // https://stackoverflow.com/questions/55092830/how-to-perform-dns-lookup-with-multiple-questions
    const question = query.questions[0] as IQuestion | undefined
    if (question) {
      logger.trace(`${formatHostname(question.QNAME)} ${TYPE[question.QTYPE]}`)

      const resolveResult = go(() => {
        switch (question.QTYPE) {
          case TYPE.A: return hosts.resolveA(question.QNAME)
          case TYPE.AAAA: return hosts.resolveAAAA(question.QNAME)
        }
      })
      if (resolveResult?.hasRecords) {
        response.header.flags.RCODE = RCODE.NoError

        if (resolveResult.address) {
          logger.info(`${formatHostname(question.QNAME)} ${resolveResult.address}`)

          const address = resolveResult.address
          assert(address)

          const answer: IResourceRecord = {
            NAME: question.QNAME
          , TYPE: question.QTYPE
          , CLASS: question.QCLASS
          , TTL: 0
          , RDATA: go(() => {
              switch (question.QTYPE) {
                case TYPE.A: return createRDATAForA(address)
                case TYPE.AAAA: return createRDATAForAAAA(address)
                default: throw new Error('Impossible route')
              }
            })
          }
          response.answers.push(answer)
        } else {
          logger.info(`${formatHostname(question.QNAME)} No records for ${TYPE[question.QTYPE]}`)
        }
      } else {
        const startTime = Date.now()
        try {
          response = await client.resolve(
            query
          , timeoutSignal(timeout)
          )
          logger.info(
            `${formatHostname(question.QNAME)} ${TYPE[question.QTYPE]}`
          , getElapsed(startTime)
          )
        } catch (e) {
          logger.error(`${formatHostname(question.QNAME)} ${e}`, getElapsed(startTime))
        }
      }
    }

    logger.trace(`response: ${JSON.stringify(response)}`)
    await respond(response)
  })

  return await server.listen()
}

function formatHostname(hostname: string): string {
  return chalk.cyan(hostname)
}

function getElapsed(startTime: number): number {
  return Date.now() - startTime
}
