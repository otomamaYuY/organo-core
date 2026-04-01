import { useLocaleStore } from '@/store/useLocaleStore'
import { translations, type TranslationKey } from '@/i18n/translations'

/**
 * Returns a translation function t(key) that resolves to the current locale's string.
 * Components re-render automatically when locale changes.
 */
export function useT() {
  const locale = useLocaleStore(s => s.locale)
  return (key: TranslationKey): string => translations[key][locale]
}
