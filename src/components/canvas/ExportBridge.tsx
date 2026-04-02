import { useEffect } from 'react'
import { useReactFlow } from 'reactflow'
import { setReactFlowInstance } from '@/hooks/useExport'

/**
 * Rendered inside <ReactFlow> so useReactFlow() is available.
 * Stores the React Flow instance for use by the export functions.
 */
export function ExportBridge() {
  const instance = useReactFlow()

  useEffect(() => {
    setReactFlowInstance(instance)
    return () => setReactFlowInstance(null)
  }, [instance])

  return null
}
