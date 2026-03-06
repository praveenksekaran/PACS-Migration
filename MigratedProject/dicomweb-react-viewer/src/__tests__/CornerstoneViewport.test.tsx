import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { useViewerStore } from '../store/viewerStore'
import { useToolStore } from '../store/toolStore'

// Use vi.hoisted so mock variables are defined before vi.mock hoisting
const {
  mockSetStack, mockRender, mockEnableElement, mockGetViewport, mockDestroy,
  mockGetCamera, mockSetCamera, mockGetProperties, mockSetProperties,
  MockRenderingEngine,
  mockToolGroupAddTool, mockToolGroupSetToolActive, mockToolGroupSetToolPassive,
  mockToolGroupAddViewport, mockCreateToolGroup,
} = vi.hoisted(() => {
  const mockSetStack = vi.fn().mockResolvedValue(undefined)
  const mockRender = vi.fn()
  const mockEnableElement = vi.fn()
  const mockGetCamera = vi.fn().mockReturnValue({ flipHorizontal: false, flipVertical: false })
  const mockSetCamera = vi.fn()
  const mockGetProperties = vi.fn().mockReturnValue({ invert: false })
  const mockSetProperties = vi.fn()
  const mockGetViewport = vi.fn().mockReturnValue({
    setStack: mockSetStack,
    render: mockRender,
    getCamera: mockGetCamera,
    setCamera: mockSetCamera,
    getProperties: mockGetProperties,
    setProperties: mockSetProperties,
  })
  const mockDestroy = vi.fn()
  const MockRenderingEngine = vi.fn().mockImplementation(() => ({
    enableElement: mockEnableElement,
    getViewport: mockGetViewport,
    destroy: mockDestroy,
  }))

  const mockToolGroupAddTool = vi.fn()
  const mockToolGroupSetToolActive = vi.fn()
  const mockToolGroupSetToolPassive = vi.fn()
  const mockToolGroupAddViewport = vi.fn()
  const mockCreateToolGroup = vi.fn().mockReturnValue({
    addTool: mockToolGroupAddTool,
    setToolActive: mockToolGroupSetToolActive,
    setToolPassive: mockToolGroupSetToolPassive,
    addViewport: mockToolGroupAddViewport,
  })

  return {
    mockSetStack, mockRender, mockEnableElement, mockGetViewport, mockDestroy,
    mockGetCamera, mockSetCamera, mockGetProperties, mockSetProperties,
    MockRenderingEngine,
    mockToolGroupAddTool, mockToolGroupSetToolActive, mockToolGroupSetToolPassive,
    mockToolGroupAddViewport, mockCreateToolGroup,
  }
})

vi.mock('@cornerstonejs/core', () => ({
  RenderingEngine: MockRenderingEngine,
  Enums: {
    ViewportType: { STACK: 'stack' },
    Events: { VOI_MODIFIED: 'VOI_MODIFIED' },
  },
}))

vi.mock('@cornerstonejs/tools', () => ({
  addTool: vi.fn(),
  ToolGroupManager: { createToolGroup: mockCreateToolGroup },
  WindowLevelTool: { toolName: 'Wwwl' },
  PanTool: { toolName: 'Pan' },
  ZoomTool: { toolName: 'Zoom' },
  StackScrollTool: { toolName: 'StackScroll' },
  Enums: { MouseBindings: { Primary: 1, Secondary: 2, Auxiliary: 4 } },
}))

import CornerstoneViewport from '../components/CornerstoneViewport'

beforeEach(() => {
  vi.clearAllMocks()
  // Restore mock implementations cleared by clearAllMocks
  mockGetViewport.mockReturnValue({
    setStack: mockSetStack,
    render: mockRender,
    getCamera: mockGetCamera,
    setCamera: mockSetCamera,
    getProperties: mockGetProperties,
    setProperties: mockSetProperties,
  })
  mockCreateToolGroup.mockReturnValue({
    addTool: mockToolGroupAddTool,
    setToolActive: mockToolGroupSetToolActive,
    setToolPassive: mockToolGroupSetToolPassive,
    addViewport: mockToolGroupAddViewport,
  })
  mockGetCamera.mockReturnValue({ flipHorizontal: false, flipVertical: false })
  mockGetProperties.mockReturnValue({ invert: false })
  mockSetStack.mockResolvedValue(undefined)
  useViewerStore.setState({ imageIds: [], currentIndex: 0, windowCenter: null, windowWidth: null })
  useToolStore.setState({ activeTool: 'Wwwl', pendingAction: null })
})

describe('CornerstoneViewport', () => {
  // ── Existing Phase 3 tests ────────────────────────────────────────────────

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
    await new Promise((r) => setTimeout(r, 50))
    expect(mockSetStack).not.toHaveBeenCalled()
  })

  it('destroys the rendering engine on unmount', () => {
    const { unmount } = render(<CornerstoneViewport />)
    unmount()
    expect(mockDestroy).toHaveBeenCalledTimes(1)
  })

  // ── Phase 4: ToolGroup ────────────────────────────────────────────────────

  it('creates a ToolGroup on mount', () => {
    render(<CornerstoneViewport />)
    expect(mockCreateToolGroup).toHaveBeenCalledTimes(1)
  })

  it('adds WindowLevelTool to the ToolGroup', () => {
    render(<CornerstoneViewport />)
    expect(mockToolGroupAddTool).toHaveBeenCalledWith('Wwwl')
  })

  it('adds PanTool to the ToolGroup', () => {
    render(<CornerstoneViewport />)
    expect(mockToolGroupAddTool).toHaveBeenCalledWith('Pan')
  })

  it('adds ZoomTool to the ToolGroup', () => {
    render(<CornerstoneViewport />)
    expect(mockToolGroupAddTool).toHaveBeenCalledWith('Zoom')
  })

  it('adds StackScrollTool to the ToolGroup', () => {
    render(<CornerstoneViewport />)
    expect(mockToolGroupAddTool).toHaveBeenCalledWith('StackScroll')
  })

  it('adds the viewport to the ToolGroup', () => {
    render(<CornerstoneViewport />)
    expect(mockToolGroupAddViewport).toHaveBeenCalledTimes(1)
  })

  it('activates StackScroll unconditionally on mount', () => {
    render(<CornerstoneViewport />)
    expect(mockToolGroupSetToolActive).toHaveBeenCalledWith(
      'StackScroll', expect.objectContaining({ bindings: [] })
    )
  })

  it('activates WindowLevel tool by default (activeTool = Wwwl)', () => {
    render(<CornerstoneViewport />)
    expect(mockToolGroupSetToolActive).toHaveBeenCalledWith(
      'Wwwl', expect.objectContaining({ bindings: expect.arrayContaining([expect.objectContaining({ mouseButton: 1 })]) })
    )
  })

  it('switches active tool to Pan when toolStore changes', async () => {
    render(<CornerstoneViewport />)
    act(() => { useToolStore.getState().setActiveTool('Pan') })
    await waitFor(() => {
      expect(mockToolGroupSetToolActive).toHaveBeenCalledWith(
        'Pan', expect.objectContaining({ bindings: expect.arrayContaining([expect.objectContaining({ mouseButton: 1 })]) })
      )
    })
  })

  // ── Phase 4: VOI_MODIFIED event → viewerStore.setWL ──────────────────────

  it('updates viewerStore.windowCenter and windowWidth on VOI_MODIFIED event', () => {
    render(<CornerstoneViewport />)
    const el = screen.getByTestId('cornerstone-viewport')
    // range: lower=-160, upper=240 → wc=40, ww=400
    el.dispatchEvent(new CustomEvent('VOI_MODIFIED', {
      detail: { range: { lower: -160, upper: 240 } },
      bubbles: false,
    }))
    expect(useViewerStore.getState().windowCenter).toBe(40)
    expect(useViewerStore.getState().windowWidth).toBe(400)
  })

  // ── Phase 4: pendingAction viewport operations ────────────────────────────

  it('FlipH action calls setCamera with toggled flipHorizontal', async () => {
    render(<CornerstoneViewport />)
    useViewerStore.getState().setActiveStack(['wad://1'], 0)
    await waitFor(() => expect(mockSetStack).toHaveBeenCalled())
    act(() => { useToolStore.getState().triggerAction('FlipH') })
    await waitFor(() => {
      expect(mockSetCamera).toHaveBeenCalledWith(expect.objectContaining({ flipHorizontal: true }))
    })
    expect(useToolStore.getState().pendingAction).toBeNull()
  })

  it('FlipV action calls setCamera with toggled flipVertical', async () => {
    render(<CornerstoneViewport />)
    useViewerStore.getState().setActiveStack(['wad://1'], 0)
    await waitFor(() => expect(mockSetStack).toHaveBeenCalled())
    act(() => { useToolStore.getState().triggerAction('FlipV') })
    await waitFor(() => {
      expect(mockSetCamera).toHaveBeenCalledWith(expect.objectContaining({ flipVertical: true }))
    })
    expect(useToolStore.getState().pendingAction).toBeNull()
  })

  it('Invert action calls setProperties with toggled invert', async () => {
    render(<CornerstoneViewport />)
    useViewerStore.getState().setActiveStack(['wad://1'], 0)
    await waitFor(() => expect(mockSetStack).toHaveBeenCalled())
    act(() => { useToolStore.getState().triggerAction('Invert') })
    await waitFor(() => {
      expect(mockSetProperties).toHaveBeenCalledWith(expect.objectContaining({ invert: true }))
    })
    expect(useToolStore.getState().pendingAction).toBeNull()
  })
})
