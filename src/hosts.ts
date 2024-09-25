import { readFileLineByLine } from 'extra-filesystem'
import { toArrayAsync } from 'iterable-operator'
import { isIPv4Address } from '@utils/is-ipv4-address.js'
import { isIPv6Address } from '@utils/is-ipv6-address.js'
import { Logger } from 'extra-logger'
import { HostnamePattern } from '@utils/hostname-pattern.js'
import { pipe } from 'extra-utils'
import { map, filter, toArray } from 'iterable-operator'
import { isntNull } from '@blackglory/prelude'
import { FileWatcher } from 'extra-watcher/file-watcher'

type IRecord = IPositiveRecord | INegativeRecord

interface IPositiveRecord {
  pattern: HostnamePattern
  address: string
}

interface INegativeRecord {
  pattern: HostnamePattern
}

interface IResolveResult {
  hasRecords: boolean
  address: string | undefined
}

export class Hosts {
  private records: IRecord[] = []

  constructor({ filename, logger }: { filename: string; logger: Logger }) {
    this.update(filename)

    const watcher = new FileWatcher(filename)
    watcher.start()
    watcher.observe().subscribe(async event => {
      switch (event.type) {
        case 'created':
        case 'modified':
          await this.update(filename)
          logger.info('The hosts file updated')
          break
      }
      watcher.reset()
    })
  }

  async update(filename: string) {
    const lines = await toArrayAsync(readFileLineByLine(filename))
    this.records = parseHosts(lines)
  }

  resolveA(hostname: string): IResolveResult {
    return this.records.reduce((result, record) => {
      if (record.pattern.match(hostname)) {
        if (record.pattern.negative) {
          return {
            hasRecords: true
          , address: undefined
          }
        } else {
          if ('address' in record && isIPv4Address(record.address)) {
            return {
              hasRecords: true
            , address: record.address
            }
          }
        }

        return {
          hasRecords: true
        , address: result.address
        }
      }
      return result
    }, {
      hasRecords: false
    , address: undefined
    } as IResolveResult)
  }

  resolveAAAA(hostname: string): IResolveResult {
    return this.records.reduce((result, record) => {
      if (record.pattern.match(hostname)) {
        if (record.pattern.negative) {
          return {
            hasRecords: true
          , address: undefined
          }
        } else {
          if ('address' in record && isIPv6Address(record.address)) {
            return {
              hasRecords: true
            , address: record.address
            }
          }
        }

        return {
          hasRecords: true
        , address: result.address
        }
      }
      return result
    }, {
      hasRecords: false
    , address: undefined
    } as IResolveResult)
  }
}

export function parseHosts(lines: Iterable<string>): IRecord[] {
  return pipe(
    lines
  , lines => map<string, IRecord | null>(lines, line => {
      if (/^\s*$/.test(line)) return null
      if (/^\s*#/.test(line)) return null

      {
        const result = line.match(/^\s*(?<address>\S+)\s+(?<hostname>\S+)\s*(?:#.*)?$/)
        if (result) {
          const { address, hostname } = result.groups as { address: string; hostname: string }
          const pattern = new HostnamePattern(hostname)
          return { pattern, address } as IPositiveRecord
        }
      }

      {
        const result = line.match(/^\s*(?<hostname>-\S+)\s*(?:#.*)?$/)
        if (result) {
          const { hostname } = result.groups as { hostname: string }
          const pattern = new HostnamePattern(hostname)
          return { pattern } as INegativeRecord
        }
      }

      throw new Error(`Invalid line: ${line}`)
    })
  , iter => filter<IRecord | null, IRecord>(iter, isntNull)
  , toArray
  )
}
