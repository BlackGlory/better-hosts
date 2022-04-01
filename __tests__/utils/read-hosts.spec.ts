import { readHosts } from '@utils/read-hosts'
import { getError } from 'return-style'

describe('readHosts', () => {
  test('postive record', () => {
    const result = readHosts(['127.0.0.1 localhost'])
    
    expect(result.length).toBe(1)
    expect(result[0].pattern.negative).toBe(false)
    expect(result[0].pattern.match('localhost')).toBe(true)
  })

  test('negative record', () => {
    const result = readHosts(['-localhost'])

    expect(result.length).toBe(1)
    expect(result[0].pattern.negative).toBe(true)
    expect(result[0].pattern.match('localhost')).toBe(true)
  })

  test('postive record with comment', () => {
    const result = readHosts(['127.0.0.1 localhost # foo'])
    
    expect(result.length).toBe(1)
    expect(result[0].pattern.negative).toBe(false)
    expect(result[0].pattern.match('localhost')).toBe(true)
  })

  test('negative record with comment', () => {
    const result = readHosts(['-localhost # foo'])

    expect(result.length).toBe(1)
    expect(result[0].pattern.negative).toBe(true)
    expect(result[0].pattern.match('localhost')).toBe(true)
  })

  test('just comment', () => {
    const result = readHosts(['# foo'])

    expect(result.length).toBe(0)
  })

  test('invalid line', () => {
    const err = getError(() => readHosts(['foo']))

    expect(err).toBeInstanceOf(Error)
  })
})
