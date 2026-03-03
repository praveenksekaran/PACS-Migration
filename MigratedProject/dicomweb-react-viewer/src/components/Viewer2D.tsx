import CornerstoneViewport from './CornerstoneViewport'
import CornerOverlay from './CornerOverlay'
import InstanceSlider from './InstanceSlider'
import MPRViewer from './MPRViewer'
import LayoutToggle from './LayoutToggle'
import { useViewerStore } from '../store/viewerStore'

export default function Viewer2D() {
  const viewportLayout = useViewerStore((s) => s.viewportLayout)

  return (
    <div
      data-testid="viewer-2d"
      style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden' }}
    >
      {viewportLayout === 'stack' ? (
        <>
          <CornerstoneViewport />
          <CornerOverlay />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)' }}>
            <InstanceSlider />
          </div>
        </>
      ) : (
        <MPRViewer />
      )}
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
        <LayoutToggle />
      </div>
    </div>
  )
}
