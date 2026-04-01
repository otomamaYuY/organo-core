import { useEffect, useRef } from 'react'
import { create } from 'zustand'
import { useOrgStore } from '@/store/useOrgStore'

const STORAGE_KEY = 'organo-core-data'
const DEBOUNCE_MS = 500

export const useSaveStatusStore = create<{
  lastSaved: number | null
  setLastSaved: (ts: number) => void
}>(set => ({
  lastSaved: null,
  setLastSaved: ts => set({ lastSaved: ts }),
}))

export function useAutoSave() {
  const nodes = useOrgStore(s => s.nodes)
  const edges = useOrgStore(s => s.edges)
  const isDirty = useOrgStore(s => s.isDirty)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isDirty) return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }))
        useSaveStatusStore.getState().setLastSaved(Date.now())
        useOrgStore.getState().markClean()
      } catch {
        // QuotaExceededError or other — silently fail
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [nodes, edges, isDirty])
}
