import { create } from 'zustand'
import { API_URL } from '../config'

export interface OverlayText {
  topLeft: string
  topRight: string
  bottomLeft: string
  bottomRight: string
}

export type ViewportLayout = 'stack' | 'mpr'

const VOLUME_ID = 'cornerstoneStreamingImageVolume:viewer-volume'

// Parse study/series/SOP UIDs from a wadors imageId.
// Format: wadors:<base>/rs/studies/<study>/series/<series>/instances/<sop>/frames/1
function parseWadorsId(id: string): { studyUid: string; seriesUid: string; sopUid: string } | null {
  const m = id.match(/\/studies\/([^/]+)\/series\/([^/]+)\/instances\/([^/]+)\/frames\//)
  if (!m) return null
  return { studyUid: m[1], seriesUid: m[2], sopUid: m[3] }
}

// Convert a wadors imageId to its wadouri equivalent.
// WADO-URI downloads the full DICOM file, including group 60xx overlay bits.
export function wadorsToWadouri(id: string): string {
  const parts = parseWadorsId(id)
  if (!parts) return id
  const { studyUid, seriesUid, sopUid } = parts
  return `wadouri:${API_URL}/wadouri?studyUID=${studyUid}&seriesUID=${seriesUid}&objectUID=${sopUid}`
}

interface ViewerState {
  imageIds: string[]
  baseImageIds: string[]
  currentIndex: number
  overlayText: OverlayText
  windowCenter: number | null
  windowWidth: number | null
  viewportLayout: ViewportLayout
  volumeId: string | null
  annotationVisible: boolean
  setActiveStack: (imageIds: string[], startIndex?: number) => void
  setCurrentIndex: (index: number) => void
  updateOverlayText: (text: Partial<OverlayText>) => void
  setWL: (windowCenter: number, windowWidth: number) => void
  setLayout: (layout: ViewportLayout) => void
  toggleAnnotation: () => void
}

const emptyOverlay: OverlayText = { topLeft: '', topRight: '', bottomLeft: '', bottomRight: '' }

export const useViewerStore = create<ViewerState>((set) => ({
  imageIds: [],
  baseImageIds: [],
  currentIndex: 0,
  overlayText: { ...emptyOverlay },
  windowCenter: null,
  windowWidth: null,
  viewportLayout: 'stack',
  volumeId: null,
  annotationVisible: false,

  setActiveStack: (imageIds, startIndex = 0) =>
    set({
      imageIds,
      baseImageIds: imageIds,
      currentIndex: startIndex,
      overlayText: { ...emptyOverlay },
      windowCenter: null,
      windowWidth: null,
      volumeId: imageIds.length > 0 ? VOLUME_ID : null,
      annotationVisible: false,
    }),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  updateOverlayText: (text) =>
    set((state) => ({ overlayText: { ...state.overlayText, ...text } })),

  setWL: (windowCenter, windowWidth) => set({ windowCenter, windowWidth }),

  setLayout: (layout) => set({ viewportLayout: layout }),

  toggleAnnotation: () =>
    set((state) => {
      if (state.baseImageIds.length === 0) return {}
      const next = !state.annotationVisible
      const imageIds = next
        ? state.baseImageIds.map(wadorsToWadouri)
        : [...state.baseImageIds]
      return { annotationVisible: next, imageIds }
    }),
}))
