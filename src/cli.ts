#!/usr/bin/env node
import { program } from 'commander'
import { startServer } from './server'
import { assert } from '@blackglory/errors'
import { Level, Logger, TerminalTransport, stringToLevel } from 'extra-logger'
import { IServerInfo, parseServerInfo } from '@utils/parse-server-info'
import { Hosts } from './hosts'

interface IOptions {
  port: string
  timeout: string
  fallbackServer: string
  log: string
}

const { name, version, description } = require('../package.json')
process.title = name

program
  .name(name)
  .version(version)
  .description(description)
  .requiredOption('--fallback-server <server>')
  .option('--timeout <seconds>', '', '30')
  .option('--port <port>', '', '53')
  .option('--log <level>', '', 'info')
  .argument('<filename>')
  .action(async (filename: string) => {
    const options = program.opts<IOptions>()
    const logLevel = getLogLevel(options)
    const timeout = getTimeout(options)
    const port = getPort(options)
    const fallbackServer = getFallbackServer(options)

    const logger = new Logger({
      level: logLevel
    , transport: new TerminalTransport({})
    })
    const hosts = new Hosts({ filename, logger })

    startServer({
      logger
    , hosts
    , fallbackServer
    , timeout
    , port
    })
  })
  .parse()

function getPort(options: IOptions): number {
  assert(/^\d+$/.test(options.port), 'The parameter port must be integer')

  return Number.parseInt(options.port, 10)
}

function getTimeout(options: IOptions): number {
  assert(/^\d+$/.test(options.timeout), 'The parameter timeout must be integer')

  return Number.parseInt(options.port, 10) * 1000
}

function getFallbackServer(options: IOptions): IServerInfo {
  return parseServerInfo(options.fallbackServer)
}

function getLogLevel(options: IOptions): Level {
  return stringToLevel(options.log, Level.Info)
}
