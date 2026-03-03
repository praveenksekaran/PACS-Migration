import { create } from 'zustand'

export type ActiveTool = 'Wwwl' | 'Pan' | 'Zoom'
export type ViewportAction = 'FlipH' | 'FlipV' | 'Invert'

interface ToolState {
  activeTool: ActiveTool
  pendingAction: ViewportAction | null
  setActiveTool: (tool: ActiveTool) => void
  triggerAction: (action: ViewportAction) => void
  clearPendingAction: () => void
}

export const useToolStore = create<ToolState>((set) => ({
  activeTool: 'Wwwl',
  pendingAction: null,
  setActiveTool: (tool) => set({ activeTool: tool }),
  triggerAction: (action) => set({ pendingAction: action }),
  clearPendingAction: () => set({ pendingAction: null }),
}))
