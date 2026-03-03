import { useState } from 'react'
import { useUIStore } from '../store/uiStore'

export default function MenuBar() {
  const openQR = useUIStore((s) => s.openQR)
  const [fileOpen, setFileOpen] = useState(false)

  function handleQR() {
    setFileOpen(false)
    openQR()
  }

  return (
    <div data-testid="menu-bar" style={{ display: 'flex', background: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
      {/* File menu */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setFileOpen((o) => !o)}
          style={{ padding: '4px 12px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          File
        </button>
        {fileOpen && (
          <div style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #ccc', zIndex: 100, minWidth: 180 }}>
            <button
              data-testid="menu-item-qr"
              onClick={handleQR}
              style={{ display: 'block', width: '100%', padding: '6px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Query / Retrieve…
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
