import { create } from 'zustand'

interface StatusState {
  message: string
  set: (message: string) => void
  clear: () => void
}

export const useStatusStore = create<StatusState>((set) => ({
  message: '',
  set: (message) => set({ message }),
  clear: () => set({ message: '' }),
}))
