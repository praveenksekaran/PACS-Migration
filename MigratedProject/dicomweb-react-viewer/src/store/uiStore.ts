import { create } from 'zustand'

interface UIState {
  isQROpen: boolean
  openQR: () => void
  closeQR: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isQROpen: false,
  openQR: () => set({ isQROpen: true }),
  closeQR: () => set({ isQROpen: false }),
}))
