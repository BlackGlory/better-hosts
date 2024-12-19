import { Address6 } from 'ip-address'
import { uint16ArrayBigEndian } from '@utils/typed-array.js'

export function createRDATAForA(ipv4Address: string): ArrayBuffer {
  const data = new Uint8Array(
    ipv4Address
      .split('.')
      .map(x => Number.parseInt(x, 10))
  )

  return data.buffer
}

export function createRDATAForAAAA(ipv6Address: string): ArrayBuffer {
  const canonicalAddress = new Address6(ipv6Address).canonicalForm()

  const data = uint16ArrayBigEndian(
    canonicalAddress
      .split(':')
      .map(x => Number.parseInt(x, 16))
  )

  return data.buffer
}
