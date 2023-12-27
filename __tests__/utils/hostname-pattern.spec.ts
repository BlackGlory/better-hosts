import { describe, test, expect } from 'vitest'
import { HostnamePattern } from '@utils/hostname-pattern.js'

describe('HostnamePattern', () => {
  test('exact match', () => {
    const pattern = new HostnamePattern('example.com')

    expect(pattern.negative).toBe(false)
    expect(pattern.match('example.com')).toBeTruthy()
    expect(pattern.match('static.example.com')).toBeFalsy()
  })

  test('wildcard match', () => {
    const pattern = new HostnamePattern('*.example.com')

    expect(pattern.negative).toBe(false)
    expect(pattern.match('example.com')).toBeFalsy()
    expect(pattern.match('static.example.com')).toBeTruthy()
  })

  test('negative exact match', () => {
    const pattern = new HostnamePattern('-example.com')

    expect(pattern.negative).toBe(true)
    expect(pattern.match('example.com')).toBeTruthy()
    expect(pattern.match('static.example.com')).toBeFalsy()
  })

  test('negative wildcard match', () => {
    const pattern = new HostnamePattern('-*.example.com')

    expect(pattern.negative).toBe(true)
    expect(pattern.match('example.com')).toBeFalsy()
    expect(pattern.match('static.example.com')).toBeTruthy()
  })
})
