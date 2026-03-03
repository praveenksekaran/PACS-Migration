import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useViewerStore } from '../store/viewerStore'
import LayoutToggle from '../components/LayoutToggle'

beforeEach(() => {
  useViewerStore.setState({ viewportLayout: 'stack' })
})

describe('LayoutToggle', () => {
  it('renders the toggle button', () => {
    render(<LayoutToggle />)
    expect(screen.getByTestId('layout-toggle')).toBeInTheDocument()
  })

  it('shows MPR label when layout is stack', () => {
    render(<LayoutToggle />)
    expect(screen.getByTestId('layout-toggle').textContent).toContain('MPR')
  })

  it('shows 2D Stack label when layout is mpr', () => {
    useViewerStore.setState({ viewportLayout: 'mpr' })
    render(<LayoutToggle />)
    expect(screen.getByTestId('layout-toggle').textContent).toContain('2D Stack')
  })

  it('clicking toggles layout from stack to mpr', () => {
    render(<LayoutToggle />)
    fireEvent.click(screen.getByTestId('layout-toggle'))
    expect(useViewerStore.getState().viewportLayout).toBe('mpr')
  })

  it('clicking toggles layout from mpr back to stack', () => {
    useViewerStore.setState({ viewportLayout: 'mpr' })
    render(<LayoutToggle />)
    fireEvent.click(screen.getByTestId('layout-toggle'))
    expect(useViewerStore.getState().viewportLayout).toBe('stack')
  })
})
