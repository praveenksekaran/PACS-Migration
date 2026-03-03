import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useViewerStore } from '../store/viewerStore'

// Mock CornerstoneViewport — it uses WebGL/RenderingEngine
vi.mock('../components/CornerstoneViewport', () => ({
  default: () => <div data-testid="cornerstone-viewport" />,
}))
// Mock cornerstone core so the import chain doesn't fail
vi.mock('@cornerstonejs/core', () => ({
  RenderingEngine: vi.fn(),
  Enums: { ViewportType: { STACK: 'stack' } },
}))

import Viewer2D from '../components/Viewer2D'

beforeEach(() => {
  useViewerStore.setState({ imageIds: [], currentIndex: 0,
    overlayText: { topLeft: '', topRight: '', bottomLeft: '', bottomRight: '' } })
})

describe('Viewer2D', () => {
  it('renders the viewer-2d container', () => {
    render(<Viewer2D />)
    expect(screen.getByTestId('viewer-2d')).toBeInTheDocument()
  })

  it('renders the cornerstone viewport', () => {
    render(<Viewer2D />)
    expect(screen.getByTestId('cornerstone-viewport')).toBeInTheDocument()
  })

  it('renders the corner overlay', () => {
    render(<Viewer2D />)
    expect(screen.getByTestId('corner-overlay')).toBeInTheDocument()
  })

  it('does not render the slider when imageIds is empty', () => {
    render(<Viewer2D />)
    expect(screen.queryByTestId('instance-slider')).not.toBeInTheDocument()
  })

  it('renders the slider when multiple imageIds are present', () => {
    useViewerStore.setState({ imageIds: ['a', 'b', 'c'], currentIndex: 0 })
    render(<Viewer2D />)
    expect(screen.getByTestId('instance-slider')).toBeInTheDocument()
  })
})
