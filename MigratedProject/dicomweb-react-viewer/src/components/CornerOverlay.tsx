import { useViewerStore } from '../store/viewerStore'

export default function CornerOverlay() {
  const { topLeft, topRight, bottomLeft, bottomRight } = useViewerStore((s) => s.overlayText)
  const windowCenter = useViewerStore((s) => s.windowCenter)
  const windowWidth = useViewerStore((s) => s.windowWidth)

  const wlText =
    windowCenter !== null && windowWidth !== null
      ? `WL: ${windowCenter}\nWW: ${windowWidth}`
      : ''

  const bottomRightContent = [bottomRight, wlText].filter(Boolean).join('\n')

  return (
    <div
      data-testid="corner-overlay"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', color: '#fff', fontSize: 12, fontFamily: 'monospace' }}
    >
      <div data-testid="overlay-top-left" style={{ position: 'absolute', top: 8, left: 8, whiteSpace: 'pre' }}>
        {topLeft}
      </div>
      <div data-testid="overlay-top-right" style={{ position: 'absolute', top: 8, right: 8, textAlign: 'right', whiteSpace: 'pre' }}>
        {topRight}
      </div>
      <div data-testid="overlay-bottom-left" style={{ position: 'absolute', bottom: 8, left: 8, whiteSpace: 'pre' }}>
        {bottomLeft}
      </div>
      <div data-testid="overlay-bottom-right" style={{ position: 'absolute', bottom: 8, right: 8, textAlign: 'right', whiteSpace: 'pre' }}>
        {bottomRightContent}
      </div>
    </div>
  )
}
