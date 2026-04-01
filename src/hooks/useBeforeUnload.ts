import { useEffect } from 'react'
import { useOrgStore } from '@/store/useOrgStore'

export function useBeforeUnload() {
  const isDirty = useOrgStore(s => s.isDirty)

  useEffect(() => {
    if (!isDirty) return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])
}
