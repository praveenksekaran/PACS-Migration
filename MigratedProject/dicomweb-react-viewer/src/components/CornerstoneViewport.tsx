import { useEffect, useRef } from 'react'
import { RenderingEngine, Enums } from '@cornerstonejs/core'
import {
  addTool,
  ToolGroupManager,
  WindowLevelTool,
  PanTool,
  ZoomTool,
  StackScrollMouseWheelTool,
  Enums as ToolsEnums,
} from '@cornerstonejs/tools'
import type { Types } from '@cornerstonejs/core'
import { useViewerStore } from '../store/viewerStore'
import { useToolStore } from '../store/toolStore'

const ENGINE_ID = 'viewer-engine'
const VIEWPORT_ID = 'viewport-0'
const TOOL_GROUP_ID = 'viewer-tools'

export default function CornerstoneViewport() {
  const elementRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<InstanceType<typeof RenderingEngine> | null>(null)
  const toolGroupRef = useRef<ReturnType<typeof ToolGroupManager.createToolGroup>>(undefined)

  const imageIds = useViewerStore((s) => s.imageIds)
  const currentIndex = useViewerStore((s) => s.currentIndex)
  const activeTool = useToolStore((s) => s.activeTool)
  const pendingAction = useToolStore((s) => s.pendingAction)
  const clearPendingAction = useToolStore((s) => s.clearPendingAction)

  // Initialise engine, viewport, ToolGroup, and VOI listener on mount
  useEffect(() => {
    if (!elementRef.current) return

    // Register tools globally (idempotent)
    addTool(WindowLevelTool)
    addTool(PanTool)
    addTool(ZoomTool)
    addTool(StackScrollMouseWheelTool)

    // Create rendering engine and viewport
    const engine = new RenderingEngine(ENGINE_ID)
    engineRef.current = engine
    engine.enableElement({
      viewportId: VIEWPORT_ID,
      type: Enums.ViewportType.STACK,
      element: elementRef.current as HTMLDivElement,
    })

    // Create ToolGroup and register tools
    const toolGroup = ToolGroupManager.createToolGroup(TOOL_GROUP_ID)
    toolGroupRef.current = toolGroup
    if (toolGroup) {
      toolGroup.addTool(WindowLevelTool.toolName)
      toolGroup.addTool(PanTool.toolName)
      toolGroup.addTool(ZoomTool.toolName)
      toolGroup.addTool(StackScrollMouseWheelTool.toolName)
      // StackScroll is always active (mouse-wheel, no button conflict)
      toolGroup.setToolActive(StackScrollMouseWheelTool.toolName, { bindings: [] })
      toolGroup.addViewport(VIEWPORT_ID, ENGINE_ID)
    }

    // VOI_MODIFIED fires on the element when WL changes via tool drag
    const handleVOI = (evt: Event) => {
      const { range } = (evt as CustomEvent).detail
      const wc = Math.round((range.lower + range.upper) / 2)
      const ww = Math.round(range.upper - range.lower)
      useViewerStore.getState().setWL(wc, ww)
    }
    const el = elementRef.current
    el.addEventListener(Enums.Events.VOI_MODIFIED, handleVOI)

    return () => {
      el.removeEventListener(Enums.Events.VOI_MODIFIED, handleVOI)
      engine.destroy()
      engineRef.current = null
      toolGroupRef.current = undefined
    }
  }, [])

  // Load / navigate stack whenever imageIds or currentIndex changes
  useEffect(() => {
    if (!engineRef.current || imageIds.length === 0) return
    const viewport = engineRef.current.getViewport(VIEWPORT_ID) as Types.IStackViewport
    if (!viewport) return
    viewport.setStack(imageIds, currentIndex).then(() => viewport.render())
  }, [imageIds, currentIndex])

  // Switch active mouse tool whenever toolStore.activeTool changes
  useEffect(() => {
    const toolGroup = toolGroupRef.current
    if (!toolGroup) return
    toolGroup.setToolPassive(WindowLevelTool.toolName)
    toolGroup.setToolPassive(PanTool.toolName)
    toolGroup.setToolPassive(ZoomTool.toolName)
    toolGroup.setToolActive(activeTool, {
      bindings: [{ mouseButton: ToolsEnums.MouseBindings.Primary }],
    })
  }, [activeTool])

  // Execute one-shot viewport actions triggered from toolStore
  useEffect(() => {
    if (!pendingAction || !engineRef.current) return
    const viewport = engineRef.current.getViewport(VIEWPORT_ID)
    if (!viewport) return

    if (pendingAction === 'FlipH') {
      const camera = viewport.getCamera()
      viewport.setCamera({ flipHorizontal: !camera.flipHorizontal })
    } else if (pendingAction === 'FlipV') {
      const camera = viewport.getCamera()
      viewport.setCamera({ flipVertical: !camera.flipVertical })
    } else if (pendingAction === 'Invert') {
      const props = viewport.getProperties()
      viewport.setProperties({ invert: !props.invert })
    }
    viewport.render()
    clearPendingAction()
  }, [pendingAction, clearPendingAction])

  return (
    <div
      ref={elementRef}
      data-testid="cornerstone-viewport"
      style={{ width: '100%', height: '100%', background: '#000' }}
    />
  )
}
