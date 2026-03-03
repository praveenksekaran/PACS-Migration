import { useViewerStore } from '../store/viewerStore'

export default function InstanceSlider() {
  const imageIds = useViewerStore((s) => s.imageIds)
  const currentIndex = useViewerStore((s) => s.currentIndex)
  const setCurrentIndex = useViewerStore((s) => s.setCurrentIndex)

  if (imageIds.length <= 1) return null

  return (
    <div data-testid="instance-slider" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 4 }}>
      <input
        type="range"
        data-testid="slider-input"
        min={0}
        max={imageIds.length - 1}
        value={currentIndex}
        onChange={(e) => setCurrentIndex(parseInt(e.target.value, 10))}
        style={{ flex: 1 }}
      />
      <span style={{ whiteSpace: 'nowrap', minWidth: 60, textAlign: 'right' }}>
        {currentIndex + 1} / {imageIds.length}
      </span>
    </div>
  )
}
