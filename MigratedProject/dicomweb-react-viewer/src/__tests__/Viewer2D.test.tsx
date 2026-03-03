import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useViewerStore } from '../store/viewerStore'

// Mock WebGL-dependent components
vi.mock('../components/CornerstoneViewport', () => ({
  default: () => <div data-testid="cornerstone-viewport" />,
}))
vi.mock('../components/MPRViewer', () => ({
  default: () => <div data-testid="mpr-viewer" />,
}))
// Mock cornerstone core so the import chain doesn't fail
vi.mock('@cornerstonejs/core', () => ({
  RenderingEngine: vi.fn(),
  Enums: { ViewportType: { STACK: 'stack' } },
}))

import Viewer2D from '../components/Viewer2D'

beforeEach(() => {
  useViewerStore.setState({
    imageIds: [],
    currentIndex: 0,
    overlayText: { topLeft: '', topRight: '', bottomLeft: '', bottomRight: '' },
    windowCenter: null,
    windowWidth: null,
    viewportLayout: 'stack',
    volumeId: null,
  })
})

describe('Viewer2D', () => {
  it('renders the viewer-2d container', () => {
    render(<Viewer2D />)
    expect(screen.getByTestId('viewer-2d')).toBeInTheDocument()
  })

  it('renders the layout toggle button', () => {
    render(<Viewer2D />)
    expect(screen.getByTestId('layout-toggle')).toBeInTheDocument()
  })

  // ── Stack layout (default) ────────────────────────────────────────────────

  it('renders the cornerstone viewport when layout is stack', () => {
    render(<Viewer2D />)
    expect(screen.getByTestId('cornerstone-viewport')).toBeInTheDocument()
  })

  it('renders the corner overlay when layout is stack', () => {
    render(<Viewer2D />)
    expect(screen.getByTestId('corner-overlay')).toBeInTheDocument()
  })

  it('does not render MPRViewer when layout is stack', () => {
    render(<Viewer2D />)
    expect(screen.queryByTestId('mpr-viewer')).not.toBeInTheDocument()
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

  // ── MPR layout ────────────────────────────────────────────────────────────

  it('renders MPRViewer when layout is mpr', () => {
    useViewerStore.setState({ viewportLayout: 'mpr' })
    render(<Viewer2D />)
    expect(screen.getByTestId('mpr-viewer')).toBeInTheDocument()
  })

  it('does not render CornerstoneViewport when layout is mpr', () => {
    useViewerStore.setState({ viewportLayout: 'mpr' })
    render(<Viewer2D />)
    expect(screen.queryByTestId('cornerstone-viewport')).not.toBeInTheDocument()
  })

  it('does not render corner overlay when layout is mpr', () => {
    useViewerStore.setState({ viewportLayout: 'mpr' })
    render(<Viewer2D />)
    expect(screen.queryByTestId('corner-overlay')).not.toBeInTheDocument()
  })
})
