import { describe, it, expect, beforeEach, vi } from 'vitest'

type WindowConfig = {
  apiUrl?: string
  dataSources?: Array<{
    configuration?: {
      qidoRoot?: string
    }
  }>
}

describe('config', () => {
  beforeEach(() => {
    vi.resetModules()
    // Clean up window.config between tests
    delete (window as Window & { config?: unknown }).config
  })

  it('returns empty string when window.config is not set', async () => {
    const { API_URL } = await import('../config')
    expect(API_URL).toBe('')
  })

  it('returns apiUrl from window.config when set directly', async () => {
    ;(window as Window & { config?: WindowConfig }).config = {
      apiUrl: 'http://localhost:5001',
    }
    const { API_URL } = await import('../config')
    expect(API_URL).toBe('http://localhost:5001')
  })

  // ── Phase 7: production server fallback ───────────────────────────────────

  it('derives API_URL from dataSources[0].configuration.qidoRoot when apiUrl absent', async () => {
    ;(window as Window & { config?: WindowConfig }).config = {
      dataSources: [{ configuration: { qidoRoot: 'http://localhost:5001/rs' } }],
    }
    const { API_URL } = await import('../config')
    expect(API_URL).toBe('http://localhost:5001')
  })

  it('strips /rs suffix from qidoRoot to produce the base URL', async () => {
    ;(window as Window & { config?: WindowConfig }).config = {
      dataSources: [{ configuration: { qidoRoot: 'https://pacs.example.com/rs' } }],
    }
    const { API_URL } = await import('../config')
    expect(API_URL).toBe('https://pacs.example.com')
  })

  it('prefers explicit apiUrl over dataSources derivation when both present', async () => {
    ;(window as Window & { config?: WindowConfig }).config = {
      apiUrl: 'http://preferred:5001',
      dataSources: [{ configuration: { qidoRoot: 'http://fallback:5001/rs' } }],
    }
    const { API_URL } = await import('../config')
    expect(API_URL).toBe('http://preferred:5001')
  })

  it('returns empty string when dataSources configuration is also absent', async () => {
    ;(window as Window & { config?: WindowConfig }).config = { dataSources: [] }
    const { API_URL } = await import('../config')
    expect(API_URL).toBe('')
  })
})
