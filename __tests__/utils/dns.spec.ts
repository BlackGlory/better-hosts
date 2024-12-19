import { test, expect } from 'vitest'
import { createRDATAForA, createRDATAForAAAA } from '@utils/dns.js'

test('createRDATAForA', () => {
  const address = '127.0.0.1'

  const result = createRDATAForA(address)

  expect(result).toStrictEqual(new Uint8Array([
    127, 0, 0, 1
  ]).buffer)
})

test('createRDATAForAAAA', () => {
  const address = '2001:0000:140F::875B:131B'

  const result = createRDATAForAAAA(address)

  expect(result).toStrictEqual(new Uint8Array([
    32, 1
  , 0, 0
  , 20, 15
  , 0, 0
  , 0, 0
  , 0, 0
  , 135, 91
  , 19, 27
  ]).buffer)
})
