import { useUIStore } from '../store/uiStore'

export default function Toolbar() {
  const openQR = useUIStore((s) => s.openQR)

  return (
    <div data-testid="toolbar" style={{ display: 'flex', gap: 4, padding: '4px 8px', background: '#fafafa', borderBottom: '1px solid #ddd' }}>
      <button data-testid="toolbar-btn-qr" onClick={openQR} title="Query / Retrieve">
        Q/R
      </button>
    </div>
  )
}
