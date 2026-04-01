import { create } from 'zustand'

interface OnboardingState {
  run: boolean
  startTour: () => void
  stopTour: () => void
}

export const useOnboardingStore = create<OnboardingState>(set => ({
  run: false,
  startTour: () => set({ run: true }),
  stopTour: () => set({ run: false }),
}))
