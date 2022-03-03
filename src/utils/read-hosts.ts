import * as hostile from 'hostile'

interface IRecord {
  hostname: string
  address: string
}

export function readHosts(filename: string): IRecord[] {
  const lines = hostile.getFile(filename, false)
  const records = lines.map(([address, hostname]) => ({
    hostname: hostname.toLowerCase()
  , address
  }))
  return records
}
