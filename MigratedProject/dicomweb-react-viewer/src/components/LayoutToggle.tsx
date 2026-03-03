import { useViewerStore } from '../store/viewerStore'

export default function LayoutToggle() {
  const layout = useViewerStore((s) => s.viewportLayout)
  const setLayout = useViewerStore((s) => s.setLayout)

  return (
    <button
      data-testid="layout-toggle"
      onClick={() => setLayout(layout === 'stack' ? 'mpr' : 'stack')}
      title={layout === 'stack' ? 'Switch to MPR view' : 'Switch to 2D Stack view'}
    >
      {layout === 'stack' ? 'MPR' : '2D Stack'}
    </button>
  )
}
