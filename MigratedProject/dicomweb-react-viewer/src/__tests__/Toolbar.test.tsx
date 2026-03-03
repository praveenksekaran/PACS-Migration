import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Toolbar from '../components/Toolbar'
import { useUIStore } from '../store/uiStore'

beforeEach(() => {
  useUIStore.setState({ isQROpen: false })
})

describe('Toolbar', () => {
  it('renders the toolbar region', () => {
    render(<Toolbar />)
    expect(screen.getByTestId('toolbar')).toBeInTheDocument()
  })

  it('renders the Query/Retrieve button', () => {
    render(<Toolbar />)
    expect(screen.getByTestId('toolbar-btn-qr')).toBeInTheDocument()
  })

  it('clicking Q/R button opens the QR modal', () => {
    render(<Toolbar />)
    fireEvent.click(screen.getByTestId('toolbar-btn-qr'))
    expect(useUIStore.getState().isQROpen).toBe(true)
  })
})
