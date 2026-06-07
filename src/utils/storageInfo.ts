import type { TranslationKey } from '@/i18n/translations'

export interface StorageKeyInfo {
  key: string
  descKey: TranslationKey
  bytes: number
  exists: boolean
}

export const ORGANO_KEYS: readonly { key: string; descKey: TranslationKey }[] = [
  { key: 'organo-core-data',    descKey: 'privacyKeyOrgData' },
  { key: 'organo-llm-settings', descKey: 'privacyKeyLlmSettings' },
  { key: 'organo-theme',        descKey: 'privacyKeyTheme' },
  { key: 'organo-locale',       descKey: 'privacyKeyLocale' },
  { key: 'organo-landing-seen', descKey: 'privacyKeyLandingSeen' },
  { key: 'organo-tour-completed', descKey: 'privacyKeyTourCompleted' },
]

export function getStorageInfo(): StorageKeyInfo[] {
  return ORGANO_KEYS.map(({ key, descKey }) => {
    try {
      const value = localStorage.getItem(key)
      if (value === null) {
        return { key, descKey, bytes: 0, exists: false }
      }
      const bytes = new Blob([value]).size
      return { key, descKey, bytes, exists: true }
    } catch {
      return { key, descKey, bytes: 0, exists: false }
    }
  })
}

export function clearAllAppData(): void {
  for (const { key } of ORGANO_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  }
}

export function removeStorageKey(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export function totalBytes(infos: StorageKeyInfo[]): number {
  return infos.reduce((sum, info) => sum + info.bytes, 0)
}
