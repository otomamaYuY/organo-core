import { create } from 'zustand'

export type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('organo-theme', theme)
}

// Apply before first render to avoid flash
const stored = (localStorage.getItem('organo-theme') as Theme | null) ?? 'dark'
applyTheme(stored)

export const useThemeStore = create<ThemeState>(set => ({
  theme: stored,
  toggleTheme: () =>
    set(state => {
      const next: Theme = state.theme === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return { theme: next }
    }),
}))
