import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useViewerStore } from '../store/viewerStore'

const {
  MockRenderingEngine, mockEnableElement, mockDestroy, mockRenderViewports,
  mockSetVolumesForViewports, mockCreateVolume,
} = vi.hoisted(() => {
  const mockEnableElement = vi.fn()
  const mockRenderViewports = vi.fn()
  const mockDestroy = vi.fn()
  const MockRenderingEngine = vi.fn().mockImplementation(() => ({
    enableElement: mockEnableElement,
    destroy: mockDestroy,
    renderViewports: mockRenderViewports,
  }))
  const mockSetVolumesForViewports = vi.fn().mockResolvedValue(undefined)
  const mockCreateVolume = vi.fn().mockResolvedValue(undefined)
  return {
    MockRenderingEngine, mockEnableElement, mockDestroy, mockRenderViewports,
    mockSetVolumesForViewports, mockCreateVolume,
  }
})

vi.mock('@cornerstonejs/core', () => ({
  RenderingEngine: MockRenderingEngine,
  Enums: {
    ViewportType: { ORTHOGRAPHIC: 'orthographic' },
    OrientationAxis: { AXIAL: 'AXIAL', CORONAL: 'CORONAL', SAGITTAL: 'SAGITTAL' },
  },
  setVolumesForViewports: mockSetVolumesForViewports,
}))

vi.mock('../lib/volumeLoader', () => ({
  createVolume: mockCreateVolume,
}))

import MPRViewer from '../components/MPRViewer'

beforeEach(() => {
  vi.clearAllMocks()
  mockSetVolumesForViewports.mockResolvedValue(undefined)
  mockCreateVolume.mockResolvedValue(undefined)
  MockRenderingEngine.mockImplementation(() => ({
    enableElement: mockEnableElement,
    destroy: mockDestroy,
    renderViewports: mockRenderViewports,
  }))
  useViewerStore.setState({
    imageIds: [],
    volumeId: null,
    viewportLayout: 'mpr',
  })
})

describe('MPRViewer', () => {
  it('renders the mpr-viewer container', () => {
    render(<MPRViewer />)
    expect(screen.getByTestId('mpr-viewer')).toBeInTheDocument()
  })

  it('renders the axial viewport panel', () => {
    render(<MPRViewer />)
    expect(screen.getByTestId('viewport-panel-axial')).toBeInTheDocument()
  })

  it('renders the coronal viewport panel', () => {
    render(<MPRViewer />)
    expect(screen.getByTestId('viewport-panel-coronal')).toBeInTheDocument()
  })

  it('renders the sagittal viewport panel', () => {
    render(<MPRViewer />)
    expect(screen.getByTestId('viewport-panel-sagittal')).toBeInTheDocument()
  })

  it('shows Axial, Coronal, Sagittal labels', () => {
    render(<MPRViewer />)
    expect(screen.getByTestId('viewport-label-axial').textContent).toBe('Axial')
    expect(screen.getByTestId('viewport-label-coronal').textContent).toBe('Coronal')
    expect(screen.getByTestId('viewport-label-sagittal').textContent).toBe('Sagittal')
  })

  it('creates a RenderingEngine on mount', () => {
    render(<MPRViewer />)
    expect(MockRenderingEngine).toHaveBeenCalledTimes(1)
  })

  it('enables 3 ORTHOGRAPHIC viewports on mount', () => {
    render(<MPRViewer />)
    expect(mockEnableElement).toHaveBeenCalledTimes(3)
    expect(mockEnableElement).toHaveBeenCalledWith(
      expect.objectContaining({ viewportId: 'axial', type: 'orthographic' })
    )
    expect(mockEnableElement).toHaveBeenCalledWith(
      expect.objectContaining({ viewportId: 'coronal', type: 'orthographic' })
    )
    expect(mockEnableElement).toHaveBeenCalledWith(
      expect.objectContaining({ viewportId: 'sagittal', type: 'orthographic' })
    )
  })

  it('calls createVolume when volumeId and imageIds are set', async () => {
    render(<MPRViewer />)
    useViewerStore.setState({
      volumeId: 'cornerstoneStreamingImageVolume:viewer-volume',
      imageIds: ['wadors://a', 'wadors://b'],
    })
    await waitFor(() => {
      expect(mockCreateVolume).toHaveBeenCalledWith(
        'cornerstoneStreamingImageVolume:viewer-volume',
        ['wadors://a', 'wadors://b']
      )
    })
  })

  it('calls setVolumesForViewports after createVolume resolves', async () => {
    render(<MPRViewer />)
    useViewerStore.setState({
      volumeId: 'cornerstoneStreamingImageVolume:viewer-volume',
      imageIds: ['wadors://a'],
    })
    await waitFor(() => {
      expect(mockSetVolumesForViewports).toHaveBeenCalledWith(
        expect.any(Object),
        [{ volumeId: 'cornerstoneStreamingImageVolume:viewer-volume' }],
        ['axial', 'coronal', 'sagittal']
      )
    })
  })

  it('calls renderViewports after setVolumesForViewports resolves', async () => {
    render(<MPRViewer />)
    useViewerStore.setState({
      volumeId: 'cornerstoneStreamingImageVolume:viewer-volume',
      imageIds: ['wadors://a'],
    })
    await waitFor(() => {
      expect(mockRenderViewports).toHaveBeenCalledWith(['axial', 'coronal', 'sagittal'])
    })
  })

  it('destroys the rendering engine on unmount', () => {
    const { unmount } = render(<MPRViewer />)
    unmount()
    expect(mockDestroy).toHaveBeenCalledTimes(1)
  })
})
