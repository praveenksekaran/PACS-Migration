import { useEffect, useRef } from 'react'
import { RenderingEngine, Enums } from '@cornerstonejs/core'
import type { Types } from '@cornerstonejs/core'
import { useViewerStore } from '../store/viewerStore'

const ENGINE_ID = 'viewer-engine'
const VIEWPORT_ID = 'viewport-0'

export default function CornerstoneViewport() {
  const elementRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<InstanceType<typeof RenderingEngine> | null>(null)
  const imageIds = useViewerStore((s) => s.imageIds)
  const currentIndex = useViewerStore((s) => s.currentIndex)

  // Initialise engine and viewport once on mount
  useEffect(() => {
    if (!elementRef.current) return
    const engine = new RenderingEngine(ENGINE_ID)
    engineRef.current = engine
    engine.enableElement({
      viewportId: VIEWPORT_ID,
      type: Enums.ViewportType.STACK,
      element: elementRef.current as HTMLDivElement,
    })
    return () => {
      engine.destroy()
      engineRef.current = null
    }
  }, [])

  // Load / navigate stack whenever imageIds or currentIndex changes
  useEffect(() => {
    if (!engineRef.current || imageIds.length === 0) return
    const viewport = engineRef.current.getViewport(VIEWPORT_ID) as Types.IStackViewport
    if (!viewport) return
    viewport.setStack(imageIds, currentIndex).then(() => viewport.render())
  }, [imageIds, currentIndex])

  return (
    <div
      ref={elementRef}
      data-testid="cornerstone-viewport"
      style={{ width: '100%', height: '100%', background: '#000' }}
    />
  )
}
