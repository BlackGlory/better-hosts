#!/usr/bin/env node
import { program } from 'commander'
import { startServer } from './server'
import { assert } from '@blackglory/errors'
import { Level, Logger, TerminalTransport, stringToLevel } from 'extra-logger'
import { parseServerInfo } from '@utils/parse-server-info'
import { Hosts } from './hosts'

program
  .name(require('../package.json').name)
  .version(require('../package.json').version)
  .description(require('../package.json').description)
  .requiredOption('--fallback-server <server>')
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
    , port: options.port
    })
  })
  .parse()

function getOptions() {
  const opts = program.opts<{
    port: string
    fallbackServer: string
    log: string
  }>()

  assert(/^\d+$/.test(opts.port), 'The parameter port must be integer')
  const port: number = Number.parseInt(opts.port, 10)

  const fallbackServer: string = opts.fallbackServer
  const logLevel: Level = stringToLevel(opts.log, Level.Info)

  return {
    port
  , fallbackServer
  , logLevel
  }
}
