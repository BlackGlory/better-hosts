#!/usr/bin/env node
import { program } from 'commander'
import { startServer } from './server'
import { assert } from '@blackglory/errors'
import { Level, Logger, TerminalTransport, stringToLevel } from 'extra-logger'
import { parseServerInfo } from '@utils/parse-server-info'
import { Hosts } from './hosts'

const { name, version, description } = require('../package.json')
process.title = name

program
  .name(name)
  .version(version)
  .description(description)
  .requiredOption('--fallback-server <server>')
  .option('--timeout [seconds]', '', '30')
  .option('--port [port]', '', '53')
  .option('--log [level]', '', 'info')
  .argument('<filename>')
  .action(async (filename: string) => {
    const options = getOptions()
    const logger = new Logger({
      level: options.logLevel
    , transport: new TerminalTransport({})
    })
    const hosts = new Hosts({
      filename
    , logger
    })

    const fallbackServer = parseServerInfo(options.fallbackServer)

    startServer({
      logger
    , hosts
    , fallbackServer
    , timeout: options.timeout
    , port: options.port
    })
  })
  .parse()

function getOptions() {
  const opts = program.opts<{
    port: string
    timeout: string
    fallbackServer: string
    log: string
  }>()

  assert(/^\d+$/.test(opts.port), 'The parameter port must be integer')
  const port: number = Number.parseInt(opts.port, 10)

  assert(/^\d+$/.test(opts.timeout), 'The parameter timeout must be integer')
  const timeout: number = Number.parseInt(opts.port, 10) * 1000

  const fallbackServer: string = opts.fallbackServer
  const logLevel: Level = stringToLevel(opts.log, Level.Info)

  return {
    port
  , timeout
  , fallbackServer
  , logLevel
  }
}
