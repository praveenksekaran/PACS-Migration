import CornerstoneViewport from './CornerstoneViewport'
import CornerOverlay from './CornerOverlay'
import InstanceSlider from './InstanceSlider'

export default function Viewer2D() {
  return (
    <div
      data-testid="viewer-2d"
      style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden' }}
    >
      <CornerstoneViewport />
      <CornerOverlay />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)' }}>
        <InstanceSlider />
      </div>
    </div>
  )
}
