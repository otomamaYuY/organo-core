import { useEffect, useRef } from 'react'
import { useReactFlow } from 'reactflow'
import { useOrgStore } from '@/store/useOrgStore'

/**
 * Rendered inside <ReactFlow> so useReactFlow() is available.
 * Calls fitView whenever applyAutoLayout increments layoutVersion.
 */
export function FitViewOnLayout() {
  const { fitView } = useReactFlow()
  const layoutVersion = useOrgStore(s => s.layoutVersion)
  const prevVersion = useRef(layoutVersion)

  useEffect(() => {
    if (layoutVersion === prevVersion.current) return
    prevVersion.current = layoutVersion
    // Small delay lets React flush the new node positions before fitView runs
    const id = setTimeout(() => fitView({ duration: 400, padding: 0.15 }), 50)
    return () => clearTimeout(id)
  }, [layoutVersion, fitView])

  return null
}
