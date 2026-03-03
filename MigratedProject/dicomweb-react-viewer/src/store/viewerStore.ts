import { create } from 'zustand'

export interface OverlayText {
  topLeft: string
  topRight: string
  bottomLeft: string
  bottomRight: string
}

export type ViewportLayout = 'stack' | 'mpr'

const VOLUME_ID = 'cornerstoneStreamingImageVolume:viewer-volume'

interface ViewerState {
  imageIds: string[]
  currentIndex: number
  overlayText: OverlayText
  windowCenter: number | null
  windowWidth: number | null
  viewportLayout: ViewportLayout
  volumeId: string | null
  setActiveStack: (imageIds: string[], startIndex?: number) => void
  setCurrentIndex: (index: number) => void
  updateOverlayText: (text: Partial<OverlayText>) => void
  setWL: (windowCenter: number, windowWidth: number) => void
  setLayout: (layout: ViewportLayout) => void
}

const emptyOverlay: OverlayText = { topLeft: '', topRight: '', bottomLeft: '', bottomRight: '' }

export const useViewerStore = create<ViewerState>((set) => ({
  imageIds: [],
  currentIndex: 0,
  overlayText: { ...emptyOverlay },
  windowCenter: null,
  windowWidth: null,
  viewportLayout: 'stack',
  volumeId: null,

  setActiveStack: (imageIds, startIndex = 0) =>
    set({
      imageIds,
      currentIndex: startIndex,
      overlayText: { ...emptyOverlay },
      windowCenter: null,
      windowWidth: null,
      volumeId: imageIds.length > 0 ? VOLUME_ID : null,
    }),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  updateOverlayText: (text) =>
    set((state) => ({ overlayText: { ...state.overlayText, ...text } })),

  setWL: (windowCenter, windowWidth) => set({ windowCenter, windowWidth }),

  setLayout: (layout) => set({ viewportLayout: layout }),
}))
