import { create } from 'zustand'

const LANDING_KEY = 'organo-landing-seen'
const TOUR_KEY = 'organo-tour-completed'

interface OnboardingState {
  run: boolean
  showLanding: boolean
  startTour: () => void
  stopTour: () => void
  initLanding: () => void
  completeLanding: () => void
}

export const useOnboardingStore = create<OnboardingState>(set => ({
  run: false,
  showLanding: false,
  startTour: () => set({ run: true }),
  stopTour: () => set({ run: false }),
  initLanding: () => {
    const seenLanding = localStorage.getItem(LANDING_KEY)
    const tourDone = localStorage.getItem(TOUR_KEY)
    if (!seenLanding && !tourDone) {
      set({ showLanding: true })
    } else if (!tourDone) {
      set({ run: true })
    }
  },
  completeLanding: () => {
    localStorage.setItem(LANDING_KEY, 'true')
    set({ showLanding: false, run: true })
  },
}))
