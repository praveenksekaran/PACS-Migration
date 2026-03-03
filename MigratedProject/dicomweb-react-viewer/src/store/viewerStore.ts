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
  setActiveStack: (imageIds: string[], startIndex?: number) => void
  setCurrentIndex: (index: number) => void
  updateOverlayText: (text: Partial<OverlayText>) => void
}

const emptyOverlay: OverlayText = { topLeft: '', topRight: '', bottomLeft: '', bottomRight: '' }

export const useViewerStore = create<ViewerState>((set) => ({
  imageIds: [],
  currentIndex: 0,
  overlayText: { ...emptyOverlay },

  setActiveStack: (imageIds, startIndex = 0) =>
    set({ imageIds, currentIndex: startIndex, overlayText: { ...emptyOverlay } }),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  updateOverlayText: (text) =>
    set((state) => ({ overlayText: { ...state.overlayText, ...text } })),
}))
