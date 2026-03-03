import { describe, it, expect } from 'vitest'
import { getTagValue } from '../utils/dicomUtils'

const pnTag = { vr: 'PN', Value: [{ Alphabetic: 'Doe^John' }] }
const strTag = { vr: 'UI', Value: ['1.2.3.4.5'] }
const emptyValTag = { vr: 'LO', Value: [] }

describe('getTagValue', () => {
  it('returns Alphabetic subfield for PN tags', () => {
    expect(getTagValue({ '00100010': pnTag }, '00100010')).toBe('Doe^John')
  })

  it('returns the string value for plain-string tags', () => {
    expect(getTagValue({ '0020000D': strTag }, '0020000D')).toBe('1.2.3.4.5')
  })

  it('returns empty string when tag is missing from dataset', () => {
    expect(getTagValue({}, '00100010')).toBe('')
  })

  it('returns empty string when Value array is empty', () => {
    expect(getTagValue({ '00100020': emptyValTag }, '00100020')).toBe('')
  })

  it('returns empty string when Value is undefined', () => {
    expect(getTagValue({ '00100010': { vr: 'PN' } }, '00100010')).toBe('')
  })
})
