import MenuBar from './MenuBar'
import Toolbar from './Toolbar'
import StudyTree from './StudyTree'
import StatusBar from './StatusBar'
import QRModal from './QRModal'
import Viewer2D from './Viewer2D'

export default function Shell() {
  return (
    <div data-testid="shell" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <MenuBar />
      <Toolbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: 260, flexShrink: 0, borderRight: '1px solid #ccc', overflow: 'auto' }}>
          <StudyTree />
        </div>
        <div data-testid="viewer-canvas" style={{ flex: 1, position: 'relative' }}>
          <Viewer2D />
        </div>
      </div>
      <StatusBar />
      <QRModal />
    </div>
  )
}
