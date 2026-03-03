import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useViewerStore } from '../store/viewerStore'

// Use vi.hoisted so mock variables are defined before vi.mock hoisting
const { mockSetStack, mockSetImageIdIndex, mockRender, mockEnableElement,
        mockGetViewport, mockDestroy, MockRenderingEngine } = vi.hoisted(() => {
  const mockSetStack = vi.fn().mockResolvedValue(undefined)
  const mockSetImageIdIndex = vi.fn().mockResolvedValue(undefined)
  const mockRender = vi.fn()
  const mockEnableElement = vi.fn()
  const mockGetViewport = vi.fn().mockReturnValue({
    setStack: mockSetStack,
    setImageIdIndex: mockSetImageIdIndex,
    render: mockRender,
  })
  const mockDestroy = vi.fn()
  const MockRenderingEngine = vi.fn().mockImplementation(() => ({
    enableElement: mockEnableElement,
    getViewport: mockGetViewport,
    destroy: mockDestroy,
  }))
  return { mockSetStack, mockSetImageIdIndex, mockRender, mockEnableElement,
           mockGetViewport, mockDestroy, MockRenderingEngine }
})

vi.mock('@cornerstonejs/core', () => ({
  RenderingEngine: MockRenderingEngine,
  Enums: { ViewportType: { STACK: 'stack' } },
}))

import CornerstoneViewport from '../components/CornerstoneViewport'

beforeEach(() => {
  vi.clearAllMocks()
  useViewerStore.setState({ imageIds: [], currentIndex: 0 })
})

describe('CornerstoneViewport', () => {
  it('renders a div container', () => {
    render(<CornerstoneViewport />)
    expect(screen.getByTestId('cornerstone-viewport')).toBeInTheDocument()
  })

  it('creates a RenderingEngine on mount', () => {
    render(<CornerstoneViewport />)
    expect(MockRenderingEngine).toHaveBeenCalledTimes(1)
  })

  it('enables the element as a STACK viewport', () => {
    render(<CornerstoneViewport />)
    expect(mockEnableElement).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'stack' })
    )
  })

  it('calls setStack when imageIds are set in the store', async () => {
    render(<CornerstoneViewport />)
    useViewerStore.getState().setActiveStack(['wad://1', 'wad://2'], 0)
    await waitFor(() => {
      expect(mockSetStack).toHaveBeenCalledWith(['wad://1', 'wad://2'], 0)
    })
  })

  it('calls render() after setStack resolves', async () => {
    render(<CornerstoneViewport />)
    useViewerStore.getState().setActiveStack(['wad://1'], 0)
    await waitFor(() => {
      expect(mockRender).toHaveBeenCalled()
    })
  })

  it('does NOT call setStack when imageIds is empty', async () => {
    render(<CornerstoneViewport />)
    // imageIds stays empty
    await new Promise((r) => setTimeout(r, 50))
    expect(mockSetStack).not.toHaveBeenCalled()
  })

  it('destroys the rendering engine on unmount', () => {
    const { unmount } = render(<CornerstoneViewport />)
    unmount()
    expect(mockDestroy).toHaveBeenCalledTimes(1)
  })
})
