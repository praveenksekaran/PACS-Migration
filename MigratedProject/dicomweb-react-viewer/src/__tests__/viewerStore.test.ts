import { describe, it, expect, beforeEach } from 'vitest'
import { useViewerStore, wadorsToWadouri } from '../store/viewerStore'

const WADORS_1 = 'wadors:http://localhost:5001/rs/studies/STU1/series/SER1/instances/SOP1/frames/1'
const WADORS_2 = 'wadors:http://localhost:5001/rs/studies/STU1/series/SER1/instances/SOP2/frames/1'
const WADOURI_1 = 'wadouri:/wadouri?studyUID=STU1&seriesUID=SER1&objectUID=SOP1'
const WADOURI_2 = 'wadouri:/wadouri?studyUID=STU1&seriesUID=SER1&objectUID=SOP2'

const INITIAL = {
  imageIds: [],
  baseImageIds: [],
  currentIndex: 0,
  overlayText: { topLeft: '', topRight: '', bottomLeft: '', bottomRight: '' },
  windowCenter: null,
  windowWidth: null,
  viewportLayout: 'stack' as const,
  volumeId: null,
  annotationVisible: false,
}

beforeEach(() => {
  useViewerStore.setState({ ...INITIAL })
})

describe('viewerStore initial state', () => {
  it('has empty imageIds', () => {
    expect(useViewerStore.getState().imageIds).toEqual([])
  })
  it('currentIndex starts at 0', () => {
    expect(useViewerStore.getState().currentIndex).toBe(0)
  })
  it('overlayText starts with empty strings', () => {
    const { overlayText } = useViewerStore.getState()
    expect(overlayText.topLeft).toBe('')
    expect(overlayText.topRight).toBe('')
    expect(overlayText.bottomLeft).toBe('')
    expect(overlayText.bottomRight).toBe('')
  })
  it('windowCenter is null by default', () => {
    expect(useViewerStore.getState().windowCenter).toBeNull()
  })
  it('windowWidth is null by default', () => {
    expect(useViewerStore.getState().windowWidth).toBeNull()
  })
  it('viewportLayout defaults to stack', () => {
    expect(useViewerStore.getState().viewportLayout).toBe('stack')
  })
  it('volumeId is null by default', () => {
    expect(useViewerStore.getState().volumeId).toBeNull()
  })
})

describe('viewerStore.setActiveStack()', () => {
  it('sets imageIds', () => {
    useViewerStore.getState().setActiveStack(['wad://1', 'wad://2'], 0)
    expect(useViewerStore.getState().imageIds).toEqual(['wad://1', 'wad://2'])
  })

  it('resets currentIndex to 0 by default', () => {
    useViewerStore.setState({ currentIndex: 5 })
    useViewerStore.getState().setActiveStack(['wad://1'], 0)
    expect(useViewerStore.getState().currentIndex).toBe(0)
  })

  it('accepts an explicit startIndex', () => {
    useViewerStore.getState().setActiveStack(['wad://1', 'wad://2', 'wad://3'], 2)
    expect(useViewerStore.getState().currentIndex).toBe(2)
  })
})

describe('viewerStore.setCurrentIndex()', () => {
  it('updates currentIndex', () => {
    useViewerStore.setState({ imageIds: ['a', 'b', 'c'] })
    useViewerStore.getState().setCurrentIndex(2)
    expect(useViewerStore.getState().currentIndex).toBe(2)
  })
})

describe('viewerStore.setWL()', () => {
  it('sets windowCenter', () => {
    useViewerStore.getState().setWL(40, 400)
    expect(useViewerStore.getState().windowCenter).toBe(40)
  })
  it('sets windowWidth', () => {
    useViewerStore.getState().setWL(40, 400)
    expect(useViewerStore.getState().windowWidth).toBe(400)
  })
})

describe('viewerStore.setActiveStack()', () => {
  it('resets windowCenter to null', () => {
    useViewerStore.setState({ windowCenter: 40, windowWidth: 400 })
    useViewerStore.getState().setActiveStack(['wad://1'], 0)
    expect(useViewerStore.getState().windowCenter).toBeNull()
  })
  it('resets windowWidth to null', () => {
    useViewerStore.setState({ windowCenter: 40, windowWidth: 400 })
    useViewerStore.getState().setActiveStack(['wad://1'], 0)
    expect(useViewerStore.getState().windowWidth).toBeNull()
  })
})

describe('viewerStore.setLayout()', () => {
  it('switches viewportLayout to mpr', () => {
    useViewerStore.getState().setLayout('mpr')
    expect(useViewerStore.getState().viewportLayout).toBe('mpr')
  })
  it('switches viewportLayout back to stack', () => {
    useViewerStore.getState().setLayout('mpr')
    useViewerStore.getState().setLayout('stack')
    expect(useViewerStore.getState().viewportLayout).toBe('stack')
  })
})

describe('viewerStore.setActiveStack() volumeId', () => {
  it('sets volumeId when imageIds are provided', () => {
    useViewerStore.getState().setActiveStack(['wad://1', 'wad://2'], 0)
    expect(useViewerStore.getState().volumeId).toBe('cornerstoneStreamingImageVolume:viewer-volume')
  })
  it('sets volumeId to null when imageIds is empty', () => {
    useViewerStore.setState({ volumeId: 'cornerstoneStreamingImageVolume:viewer-volume' })
    useViewerStore.getState().setActiveStack([], 0)
    expect(useViewerStore.getState().volumeId).toBeNull()
  })
})

describe('viewerStore.updateOverlayText()', () => {
  it('merges partial overlay text', () => {
    useViewerStore.getState().updateOverlayText({ topLeft: 'Smith^John', bottomRight: 'WL:40 WW:400' })
    const { overlayText } = useViewerStore.getState()
    expect(overlayText.topLeft).toBe('Smith^John')
    expect(overlayText.bottomRight).toBe('WL:40 WW:400')
    expect(overlayText.topRight).toBe('')  // unchanged
    expect(overlayText.bottomLeft).toBe('')  // unchanged
  })
})

// ── Phase 6: Annotation Overlay ────────────────────────────────────────────

describe('wadorsToWadouri()', () => {
  it('converts a wadors imageId to wadouri scheme', () => {
    expect(wadorsToWadouri(WADORS_1)).toBe(WADOURI_1)
  })

  it('returns the original string unchanged for unrecognised formats', () => {
    expect(wadorsToWadouri('unknown://foo')).toBe('unknown://foo')
  })
})

describe('viewerStore initial state (Phase 6)', () => {
  it('annotationVisible defaults to false', () => {
    expect(useViewerStore.getState().annotationVisible).toBe(false)
  })

  it('baseImageIds defaults to empty array', () => {
    expect(useViewerStore.getState().baseImageIds).toEqual([])
  })
})

describe('viewerStore.setActiveStack() (Phase 6)', () => {
  it('saves wadors imageIds into baseImageIds', () => {
    useViewerStore.getState().setActiveStack([WADORS_1, WADORS_2], 0)
    expect(useViewerStore.getState().baseImageIds).toEqual([WADORS_1, WADORS_2])
  })

  it('resets annotationVisible to false on new series load', () => {
    useViewerStore.setState({ annotationVisible: true })
    useViewerStore.getState().setActiveStack([WADORS_1], 0)
    expect(useViewerStore.getState().annotationVisible).toBe(false)
  })
})

describe('viewerStore.toggleAnnotation()', () => {
  it('sets annotationVisible to true on first call', () => {
    useViewerStore.getState().setActiveStack([WADORS_1, WADORS_2], 0)
    useViewerStore.getState().toggleAnnotation()
    expect(useViewerStore.getState().annotationVisible).toBe(true)
  })

  it('sets annotationVisible back to false on second call', () => {
    useViewerStore.getState().setActiveStack([WADORS_1, WADORS_2], 0)
    useViewerStore.getState().toggleAnnotation()
    useViewerStore.getState().toggleAnnotation()
    expect(useViewerStore.getState().annotationVisible).toBe(false)
  })

  it('replaces imageIds with wadouri scheme when turning ON', () => {
    useViewerStore.getState().setActiveStack([WADORS_1, WADORS_2], 0)
    useViewerStore.getState().toggleAnnotation()
    expect(useViewerStore.getState().imageIds).toEqual([WADOURI_1, WADOURI_2])
  })

  it('restores wadors imageIds when turning OFF', () => {
    useViewerStore.getState().setActiveStack([WADORS_1, WADORS_2], 0)
    useViewerStore.getState().toggleAnnotation()
    useViewerStore.getState().toggleAnnotation()
    expect(useViewerStore.getState().imageIds).toEqual([WADORS_1, WADORS_2])
  })

  it('does not modify baseImageIds during toggle', () => {
    useViewerStore.getState().setActiveStack([WADORS_1, WADORS_2], 0)
    useViewerStore.getState().toggleAnnotation()
    expect(useViewerStore.getState().baseImageIds).toEqual([WADORS_1, WADORS_2])
  })

  it('is a no-op when no imageIds are loaded', () => {
    useViewerStore.getState().toggleAnnotation()
    expect(useViewerStore.getState().annotationVisible).toBe(false)
    expect(useViewerStore.getState().imageIds).toEqual([])
  })

  it('does not change currentIndex during toggle', () => {
    useViewerStore.getState().setActiveStack([WADORS_1, WADORS_2], 1)
    useViewerStore.getState().toggleAnnotation()
    expect(useViewerStore.getState().currentIndex).toBe(1)
  })
})
