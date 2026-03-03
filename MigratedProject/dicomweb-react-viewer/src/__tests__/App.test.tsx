import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Mock cornerstone module before importing App
vi.mock('../lib/cornerstone', () => ({
  initCornerstone: vi.fn(() => Promise.resolve()),
}))

import App from '../App'
import { initCornerstone } from '../lib/cornerstone'

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading indicator while cornerstone initialises', () => {
    // Make init hang so we can inspect the loading state
    vi.mocked(initCornerstone).mockReturnValue(new Promise(() => {}))
    render(<App />)
    expect(screen.getByTestId('app-loading')).toBeInTheDocument()
  })

  it('renders Shell after cornerstone resolves', async () => {
    vi.mocked(initCornerstone).mockResolvedValue(undefined)
    render(<App />)
    await waitFor(() =>
      expect(screen.getByTestId('shell')).toBeInTheDocument()
    )
  })

  it('does not show loading indicator after init completes', async () => {
    vi.mocked(initCornerstone).mockResolvedValue(undefined)
    render(<App />)
    await waitFor(() =>
      expect(screen.queryByTestId('app-loading')).not.toBeInTheDocument()
    )
  })
})
