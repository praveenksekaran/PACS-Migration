import { forwardRef } from 'react'

interface ViewportPanelProps {
  viewportId: string
  label: string
}

const ViewportPanel = forwardRef<HTMLDivElement, ViewportPanelProps>(
  ({ viewportId, label }, ref) => (
    <div
      data-testid={`viewport-panel-${viewportId}`}
      style={{ position: 'relative', overflow: 'hidden', background: '#000' }}
    >
      <div
        ref={ref}
        data-testid={`viewport-canvas-${viewportId}`}
        style={{ width: '100%', height: '100%' }}
      />
      <div
        data-testid={`viewport-label-${viewportId}`}
        style={{ position: 'absolute', top: 4, left: 4, color: '#fff', fontSize: 12, pointerEvents: 'none' }}
      >
        {label}
      </div>
    </div>
  )
)

ViewportPanel.displayName = 'ViewportPanel'
export default ViewportPanel
