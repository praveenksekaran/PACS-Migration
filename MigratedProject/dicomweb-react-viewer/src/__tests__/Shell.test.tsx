import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Shell from '../components/Shell'

describe('Shell layout', () => {
  it('renders the menu-bar region', () => {
    render(<Shell />)
    expect(screen.getByTestId('menu-bar')).toBeInTheDocument()
  })

  it('renders the toolbar region', () => {
    render(<Shell />)
    expect(screen.getByTestId('toolbar')).toBeInTheDocument()
  })

  it('renders the study-tree region', () => {
    render(<Shell />)
    expect(screen.getByTestId('study-tree')).toBeInTheDocument()
  })

  it('renders the viewer-canvas region', () => {
    render(<Shell />)
    expect(screen.getByTestId('viewer-canvas')).toBeInTheDocument()
  })

  it('renders the status-bar region', () => {
    render(<Shell />)
    expect(screen.getByTestId('status-bar')).toBeInTheDocument()
  })
})
