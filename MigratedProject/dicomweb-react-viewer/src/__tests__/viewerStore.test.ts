import { describe, it, expect, beforeEach } from 'vitest'
import { useViewerStore } from '../store/viewerStore'

const INITIAL = {
  imageIds: [],
  currentIndex: 0,
  overlayText: { topLeft: '', topRight: '', bottomLeft: '', bottomRight: '' },
  windowCenter: null,
  windowWidth: null,
  viewportLayout: 'stack' as const,
  volumeId: null,
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
