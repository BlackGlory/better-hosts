import { IterableOperator } from 'iterable-operator/lib/es2018/style/chaining'
import { isntNull } from '@blackglory/prelude'
import { HostnamePattern } from '@utils/hostname-pattern'

export interface IPositiveRecord {
  pattern: HostnamePattern
  address: string
}

export interface INegativeRecord {
  pattern: HostnamePattern
}

export type IRecord = IPositiveRecord | INegativeRecord

export function readHosts(lines: Iterable<string>): IRecord[] {
  return new IterableOperator(lines)
    .map<IRecord | null>(line => {
      if (/^\s*$/.test(line)) return null
      if (/^\s*#/.test(line)) return null

      {
        const result = line.match(/^\s*(?<address>\S+)\s+(?<hostname>[\S^-]\S*)\s*(?:#.*)?$/)
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
    .filter<IRecord>(isntNull)
    .toArray()
}
