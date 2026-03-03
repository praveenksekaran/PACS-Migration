import { useUIStore } from '../store/uiStore'
import { useToolStore } from '../store/toolStore'
import type { ActiveTool, ViewportAction } from '../store/toolStore'

export default function Toolbar() {
  const openQR = useUIStore((s) => s.openQR)
  const activeTool = useToolStore((s) => s.activeTool)
  const setActiveTool = useToolStore((s) => s.setActiveTool)
  const triggerAction = useToolStore((s) => s.triggerAction)

  const toolBtn = (testId: string, label: string, tool: ActiveTool) => (
    <button
      data-testid={testId}
      onClick={() => setActiveTool(tool)}
      title={label}
      style={{ fontWeight: activeTool === tool ? 'bold' : 'normal' }}
    >
      {label}
    </button>
  )

  const actionBtn = (testId: string, label: string, action: ViewportAction) => (
    <button data-testid={testId} onClick={() => triggerAction(action)} title={label}>
      {label}
    </button>
  )

  return (
    <div
      data-testid="toolbar"
      style={{ display: 'flex', gap: 4, padding: '4px 8px', background: '#fafafa', borderBottom: '1px solid #ddd' }}
    >
      <button data-testid="toolbar-btn-qr" onClick={openQR} title="Query / Retrieve">
        Q/R
      </button>
      <span style={{ width: 1, background: '#ccc', margin: '0 4px' }} />
      {toolBtn('toolbar-btn-wl', 'WL', 'Wwwl')}
      {toolBtn('toolbar-btn-pan', 'Pan', 'Pan')}
      {toolBtn('toolbar-btn-zoom', 'Zoom', 'Zoom')}
      <span style={{ width: 1, background: '#ccc', margin: '0 4px' }} />
      {actionBtn('toolbar-btn-fliph', 'Flip H', 'FlipH')}
      {actionBtn('toolbar-btn-flipv', 'Flip V', 'FlipV')}
      {actionBtn('toolbar-btn-invert', 'Invert', 'Invert')}
    </div>
  )
}
