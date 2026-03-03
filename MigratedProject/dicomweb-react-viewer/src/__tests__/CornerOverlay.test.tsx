import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import CornerOverlay from '../components/CornerOverlay'
import { useViewerStore } from '../store/viewerStore'

beforeEach(() => {
  useViewerStore.setState({
    overlayText: { topLeft: '', topRight: '', bottomLeft: '', bottomRight: '' },
  })
})

describe('CornerOverlay', () => {
  it('renders the overlay container', () => {
    render(<CornerOverlay />)
    expect(screen.getByTestId('corner-overlay')).toBeInTheDocument()
  })

  it('renders all 4 corner regions', () => {
    render(<CornerOverlay />)
    expect(screen.getByTestId('overlay-top-left')).toBeInTheDocument()
    expect(screen.getByTestId('overlay-top-right')).toBeInTheDocument()
    expect(screen.getByTestId('overlay-bottom-left')).toBeInTheDocument()
    expect(screen.getByTestId('overlay-bottom-right')).toBeInTheDocument()
  })

  it('top-left shows patient demographics text', () => {
    useViewerStore.setState({
      overlayText: { topLeft: 'Smith^Jane\n00456\nF', topRight: '', bottomLeft: '', bottomRight: '' },
    })
    render(<CornerOverlay />)
    expect(screen.getByTestId('overlay-top-left').textContent).toContain('Smith^Jane')
  })

  it('top-right shows scanner and date text', () => {
    useViewerStore.setState({
      overlayText: { topLeft: '', topRight: 'SOMATOM CT\n20240115', bottomLeft: '', bottomRight: '' },
    })
    render(<CornerOverlay />)
    expect(screen.getByTestId('overlay-top-right').textContent).toContain('SOMATOM CT')
  })

  it('bottom-left shows modality and frame position', () => {
    useViewerStore.setState({
      overlayText: { topLeft: '', topRight: '', bottomLeft: 'MR\nImages: 4/10\nSeries: 2', bottomRight: '' },
    })
    render(<CornerOverlay />)
    expect(screen.getByTestId('overlay-bottom-left').textContent).toContain('Images: 4/10')
  })

  it('bottom-right shows WL/WW values', () => {
    useViewerStore.setState({
      overlayText: { topLeft: '', topRight: '', bottomLeft: '', bottomRight: 'WL:40 WW:400' },
    })
    render(<CornerOverlay />)
    expect(screen.getByTestId('overlay-bottom-right').textContent).toContain('WL:40 WW:400')
  })

  it('overlay container is absolutely positioned and pointer-events none', () => {
    render(<CornerOverlay />)
    const el = screen.getByTestId('corner-overlay')
    expect(el.style.position).toBe('absolute')
    expect(el.style.pointerEvents).toBe('none')
  })
})
