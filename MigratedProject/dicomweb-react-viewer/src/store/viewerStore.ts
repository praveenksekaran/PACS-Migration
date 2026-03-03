import { create } from 'zustand'

export interface OverlayText {
  topLeft: string
  topRight: string
  bottomLeft: string
  bottomRight: string
}

interface ViewerState {
  imageIds: string[]
  currentIndex: number
  overlayText: OverlayText
  windowCenter: number | null
  windowWidth: number | null
  setActiveStack: (imageIds: string[], startIndex?: number) => void
  setCurrentIndex: (index: number) => void
  updateOverlayText: (text: Partial<OverlayText>) => void
  setWL: (windowCenter: number, windowWidth: number) => void
}

const emptyOverlay: OverlayText = { topLeft: '', topRight: '', bottomLeft: '', bottomRight: '' }

export const useViewerStore = create<ViewerState>((set) => ({
  imageIds: [],
  currentIndex: 0,
  overlayText: { ...emptyOverlay },
  windowCenter: null,
  windowWidth: null,

  setActiveStack: (imageIds, startIndex = 0) =>
    set({ imageIds, currentIndex: startIndex, overlayText: { ...emptyOverlay }, windowCenter: null, windowWidth: null }),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  updateOverlayText: (text) =>
    set((state) => ({ overlayText: { ...state.overlayText, ...text } })),

  setWL: (windowCenter, windowWidth) => set({ windowCenter, windowWidth }),
}))
