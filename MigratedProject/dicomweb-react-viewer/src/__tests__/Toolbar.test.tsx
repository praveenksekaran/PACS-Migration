import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Toolbar from '../components/Toolbar'
import { useUIStore } from '../store/uiStore'
import { useToolStore } from '../store/toolStore'
import { useViewerStore } from '../store/viewerStore'

const WADORS_1 = 'wadors:http://localhost:5001/rs/studies/STU1/series/SER1/instances/SOP1/frames/1'

beforeEach(() => {
  useUIStore.setState({ isQROpen: false })
  useToolStore.setState({ activeTool: 'Wwwl', pendingAction: null })
  useViewerStore.setState({
    imageIds: [],
    baseImageIds: [],
    annotationVisible: false,
    currentIndex: 0,
    overlayText: { topLeft: '', topRight: '', bottomLeft: '', bottomRight: '' },
    windowCenter: null,
    windowWidth: null,
    viewportLayout: 'stack',
    volumeId: null,
  })
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

  // ── Phase 4 tool buttons ──────────────────────────────────────────────────

  it('renders the Window/Level button', () => {
    render(<Toolbar />)
    expect(screen.getByTestId('toolbar-btn-wl')).toBeInTheDocument()
  })

  it('renders the Pan button', () => {
    render(<Toolbar />)
    expect(screen.getByTestId('toolbar-btn-pan')).toBeInTheDocument()
  })

  it('renders the Zoom button', () => {
    render(<Toolbar />)
    expect(screen.getByTestId('toolbar-btn-zoom')).toBeInTheDocument()
  })

  it('renders the Flip H button', () => {
    render(<Toolbar />)
    expect(screen.getByTestId('toolbar-btn-fliph')).toBeInTheDocument()
  })

  it('renders the Flip V button', () => {
    render(<Toolbar />)
    expect(screen.getByTestId('toolbar-btn-flipv')).toBeInTheDocument()
  })

  it('renders the Invert button', () => {
    render(<Toolbar />)
    expect(screen.getByTestId('toolbar-btn-invert')).toBeInTheDocument()
  })

  it('clicking WL button sets activeTool to Wwwl', () => {
    useToolStore.setState({ activeTool: 'Pan' })
    render(<Toolbar />)
    fireEvent.click(screen.getByTestId('toolbar-btn-wl'))
    expect(useToolStore.getState().activeTool).toBe('Wwwl')
  })

  it('clicking Pan button sets activeTool to Pan', () => {
    render(<Toolbar />)
    fireEvent.click(screen.getByTestId('toolbar-btn-pan'))
    expect(useToolStore.getState().activeTool).toBe('Pan')
  })

  it('clicking Zoom button sets activeTool to Zoom', () => {
    render(<Toolbar />)
    fireEvent.click(screen.getByTestId('toolbar-btn-zoom'))
    expect(useToolStore.getState().activeTool).toBe('Zoom')
  })

  it('clicking Flip H button triggers FlipH action', () => {
    render(<Toolbar />)
    fireEvent.click(screen.getByTestId('toolbar-btn-fliph'))
    expect(useToolStore.getState().pendingAction).toBe('FlipH')
  })

  it('clicking Flip V button triggers FlipV action', () => {
    render(<Toolbar />)
    fireEvent.click(screen.getByTestId('toolbar-btn-flipv'))
    expect(useToolStore.getState().pendingAction).toBe('FlipV')
  })

  it('clicking Invert button triggers Invert action', () => {
    render(<Toolbar />)
    fireEvent.click(screen.getByTestId('toolbar-btn-invert'))
    expect(useToolStore.getState().pendingAction).toBe('Invert')
  })

  // ── Phase 6: Annotation button ────────────────────────────────────────────

  it('renders the Annotation button', () => {
    render(<Toolbar />)
    expect(screen.getByTestId('toolbar-btn-annotation')).toBeInTheDocument()
  })

  it('Annotation button shows "Annotation" label when annotation is off', () => {
    render(<Toolbar />)
    expect(screen.getByTestId('toolbar-btn-annotation')).toHaveTextContent('Annotation')
  })

  it('Annotation button shows "Show Original" label when annotation is on', () => {
    useViewerStore.setState({ annotationVisible: true })
    render(<Toolbar />)
    expect(screen.getByTestId('toolbar-btn-annotation')).toHaveTextContent('Show Original')
  })

  it('clicking Annotation button calls toggleAnnotation', () => {
    useViewerStore.setState({ baseImageIds: [WADORS_1], imageIds: [WADORS_1] })
    render(<Toolbar />)
    fireEvent.click(screen.getByTestId('toolbar-btn-annotation'))
    expect(useViewerStore.getState().annotationVisible).toBe(true)
  })

  it('Annotation button is bold when annotationVisible is true', () => {
    useViewerStore.setState({ annotationVisible: true })
    render(<Toolbar />)
    expect(screen.getByTestId('toolbar-btn-annotation')).toHaveStyle({ fontWeight: 'bold' })
  })
})
