import { create } from 'zustand'

interface JsonPanelState {
  isOpen: boolean
  togglePanel: () => void
  openPanel: () => void
  closePanel: () => void
}

export const useJsonPanelStore = create<JsonPanelState>(set => ({
  isOpen: false,
  togglePanel: () => set(s => ({ isOpen: !s.isOpen })),
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
}))
