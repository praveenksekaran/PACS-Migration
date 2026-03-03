import { describe, it, expect, beforeEach, vi } from 'vitest'

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

  it('returns apiUrl from window.config when set', async () => {
    ;(window as Window & { config?: { apiUrl: string } }).config = {
      apiUrl: 'http://localhost:5001',
    }
    const { API_URL } = await import('../config')
    expect(API_URL).toBe('http://localhost:5001')
  })
})
