import { create } from 'zustand'
import type { Locale } from '@/i18n/translations'

interface LocaleState {
  locale: Locale
  toggleLocale: () => void
}

const stored = (localStorage.getItem('organo-locale') as Locale | null) ?? 'ja'

export const useLocaleStore = create<LocaleState>(set => ({
  locale: stored,
  toggleLocale: () =>
    set(state => {
      const next: Locale = state.locale === 'ja' ? 'en' : 'ja'
      localStorage.setItem('organo-locale', next)
      return { locale: next }
    }),
}))
