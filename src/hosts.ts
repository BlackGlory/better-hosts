import { readFileLineByLine } from 'extra-filesystem'
import { toArrayAsync } from 'iterable-operator'
import { isIPv4Address } from '@utils/is-ipv4-address'
import { isIPv6Address } from '@utils/is-ipv6-address'
import { readHosts, IRecord } from '@utils/read-hosts'
import { Logger } from 'extra-logger'
import chokidar from 'chokidar'

interface IResult {
  hasRecords: boolean
  address: string | undefined
}

export class Hosts {
  private records: IRecord[] = []

  constructor({ filename, logger }: { filename: string; logger: Logger }) {
    this.update(filename)

    chokidar.watch(filename, { ignoreInitial: true }).on('change', async () => {
      await this.update(filename)
      logger.info('The hosts file updated')
    })
  }

  async update(filename: string) {
    const lines = await toArrayAsync(readFileLineByLine(filename))
    this.records = readHosts(lines)
  }

  resolveA(hostname: string): IResult {
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
    } as IResult)
  }

  resolveAAAA(hostname: string): IResult {
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
    } as IResult)
  }
}
