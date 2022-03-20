import { isIPv4Address } from '@utils/is-ipv4-address'
import { isIPv6Address } from '@utils/is-ipv6-address'
import { HostnamePattern } from '@utils/hostname-pattern'
import { readHosts } from '@utils/read-hosts'
import { Logger } from 'extra-logger'
import chokidar from 'chokidar'

interface IRecord {
  pattern: HostnamePattern
  address: string
}

interface IResult {
  address: string | undefined
  hasRecords: boolean
}

export class Hosts {
  private records: IRecord[] = []

  constructor({ filename, logger }: { filename: string; logger: Logger }) {
    this.update(filename)

    chokidar.watch(filename, { ignoreInitial: true }).on('change', () => {
      this.update(filename)
      logger.info('The hosts file updated')
    })
  }

  update(filename: string) {
    this.records = readHosts(filename).map(record => ({
      pattern: new HostnamePattern(record.hostname)
    , address: record.address
    }))
  }

  resolveA(hostname: string): IResult {
    const records = this.records.filter(record => record.pattern.match(hostname))
    const record = records.find(record => isIPv4Address(record.address))
    return {
      address: record?.address
    , hasRecords: !!records.length
    }
  }

  resolveAAAA(hostname: string): IResult {
    const records = this.records.filter(record => record.pattern.match(hostname))
    const record = records.find(record => isIPv6Address(record.address))
    return {
      address: record?.address
    , hasRecords: !!records.length
    }
  }
}
