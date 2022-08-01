import { parseHosts } from '@src/hosts'
import { getError } from 'return-style'

describe('parseHosts', () => {
  test('postive record', () => {
    const result = parseHosts(['127.0.0.1 localhost'])
    
    expect(result.length).toBe(1)
    expect(result[0].pattern.negative).toBe(false)
    expect(result[0].pattern.match('localhost')).toBe(true)
  })

  test('negative record', () => {
    const result = parseHosts(['-localhost'])

    expect(result.length).toBe(1)
    expect(result[0].pattern.negative).toBe(true)
    expect(result[0].pattern.match('localhost')).toBe(true)
  })

  test('postive record with comment', () => {
    const result = parseHosts(['127.0.0.1 localhost # foo'])
    
    expect(result.length).toBe(1)
    expect(result[0].pattern.negative).toBe(false)
    expect(result[0].pattern.match('localhost')).toBe(true)
  })

  test('negative record with comment', () => {
    const result = parseHosts(['-localhost # foo'])

    expect(result.length).toBe(1)
    expect(result[0].pattern.negative).toBe(true)
    expect(result[0].pattern.match('localhost')).toBe(true)
  })

  test('just comment', () => {
    const result = parseHosts(['# foo'])

    expect(result.length).toBe(0)
  })

  test('invalid line', () => {
    const err = getError(() => parseHosts(['foo']))

    expect(err).toBeInstanceOf(Error)
  })
})
