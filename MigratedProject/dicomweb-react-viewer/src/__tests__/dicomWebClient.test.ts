import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock config so API_URL is predictable
vi.mock('../config', () => ({ API_URL: 'http://test-server' }))

import { searchStudies, searchSeries, searchInstances } from '../api/dicomWebClient'

const mockJson = vi.fn()
const mockFetch = vi.fn()

beforeEach(() => {
  mockJson.mockResolvedValue([])
  mockFetch.mockResolvedValue({ ok: true, json: mockJson })
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('searchStudies', () => {
  it('calls /rs/studies with PatientName parameter', async () => {
    await searchStudies('Smith', 'patientName')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://test-server/rs/studies?PatientName=Smith'
    )
  })

  it('calls /rs/studies with PatientID parameter', async () => {
    await searchStudies('12345', 'patientId')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://test-server/rs/studies?PatientID=12345'
    )
  })

  it('uses wildcard "*" when query is empty for PatientName', async () => {
    await searchStudies('', 'patientName')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://test-server/rs/studies?PatientName=*'
    )
  })

  it('returns parsed JSON array', async () => {
    const data = [{ '00100010': { vr: 'PN', Value: [{ Alphabetic: 'Doe^John' }] } }]
    mockJson.mockResolvedValue(data)
    const result = await searchStudies('Doe', 'patientName')
    expect(result).toEqual(data)
  })

  it('throws when response is not OK', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 })
    await expect(searchStudies('x', 'patientName')).rejects.toThrow('500')
  })
})

describe('searchSeries', () => {
  it('calls /rs/studies/{uid}/series', async () => {
    await searchSeries('1.2.3')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://test-server/rs/studies/1.2.3/series'
    )
  })

  it('throws when response is not OK', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 })
    await expect(searchSeries('bad')).rejects.toThrow('404')
  })
})

describe('searchInstances', () => {
  it('calls /rs/studies/{uid}/series/{uid}/instances', async () => {
    await searchInstances('1.2.3', '4.5.6')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://test-server/rs/studies/1.2.3/series/4.5.6/instances'
    )
  })

  it('throws when response is not OK', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 })
    await expect(searchInstances('a', 'b')).rejects.toThrow('404')
  })
})
