import { useCallback, useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { X, Code2, AlertTriangle } from 'lucide-react'
import { useOrgStore } from '@/store/useOrgStore'
import { useJsonPanelStore } from '@/store/useJsonPanelStore'
import { useThemeStore } from '@/store/useThemeStore'
import type { OrgNode, OrgEdge } from '@/types'

const PANEL_WIDTH = 480
const TRIGGER_WIDTH = 8
const DEBOUNCE_MS = 600

function serializeOrgData(nodes: OrgNode[], edges: OrgEdge[]): string {
  return JSON.stringify({ nodes, edges }, null, 2)
}

export function JsonSidePanel() {
  const nodes = useOrgStore(s => s.nodes)
  const edges = useOrgStore(s => s.edges)
  const importFromJson = useOrgStore(s => s.importFromJson)
  const { isOpen, togglePanel } = useJsonPanelStore()
  const theme = useThemeStore(s => s.theme)

  const [editorValue, setEditorValue] = useState(() => serializeOrgData(nodes, edges))
  const [parseError, setParseError] = useState<string | null>(null)
  const [triggerHovered, setTriggerHovered] = useState(false)

  // Guard against sync loops: when we push changes from editor → store,
  // we set this ref so the store → editor effect skips one cycle.
  const suppressStoreSync = useRef(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Store → Editor sync: when nodes/edges change from GUI, update editor text
  useEffect(() => {
    if (suppressStoreSync.current) {
      suppressStoreSync.current = false
      return
    }
    const serialized = serializeOrgData(nodes, edges)
    setEditorValue(serialized)
    setParseError(null)
  }, [nodes, edges])

  // Editor → Store sync (debounced)
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value === undefined) return
      setEditorValue(value)

      if (debounceTimer.current) clearTimeout(debounceTimer.current)

      debounceTimer.current = setTimeout(() => {
        try {
          const parsed = JSON.parse(value)
          if (!parsed.nodes || !Array.isArray(parsed.nodes) || !parsed.edges || !Array.isArray(parsed.edges)) {
            setParseError('JSON must contain "nodes" and "edges" arrays')
            return
          }
          setParseError(null)
          suppressStoreSync.current = true
          importFromJson(parsed)
        } catch (e) {
          setParseError(e instanceof Error ? e.message : 'Invalid JSON')
        }
      }, DEBOUNCE_MS)
    },
    [importFromJson],
  )

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  return (
    <>
      {/* Edge trigger — thin bar on the right edge */}
      <div
        data-testid="json-panel-trigger"
        onMouseEnter={() => setTriggerHovered(true)}
        onMouseLeave={() => setTriggerHovered(false)}
        onClick={togglePanel}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: TRIGGER_WIDTH,
          height: '100%',
          zIndex: 20,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.18s ease, width 0.18s ease',
          background: triggerHovered
            ? 'var(--accent-bg)'
            : 'transparent',
          borderLeft: triggerHovered
            ? '2px solid var(--accent)'
            : '1px solid transparent',
        }}
      >
        {/* Hover indicator dot */}
        {triggerHovered && (
          <div
            style={{
              width: 3,
              height: 40,
              borderRadius: 2,
              background: 'var(--accent)',
              opacity: 0.8,
            }}
          />
        )}
      </div>

      {/* Panel */}
      <div
        data-testid="json-side-panel"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: PANEL_WIDTH,
          height: '100%',
          background: 'var(--panel-bg)',
          borderLeft: '1px solid var(--panel-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 15,
          transform: isOpen ? 'translateX(0)' : `translateX(100%)`,
          transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
          pointerEvents: isOpen ? 'auto' : 'none',
          boxShadow: isOpen ? '-4px 0 24px rgba(0,0,0,0.25)' : 'none',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--text-2)',
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}
          >
            <Code2 size={13} />
            JSON Editor
          </div>
          <button
            data-testid="json-panel-close"
            onClick={togglePanel}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '4px 6px',
              cursor: 'pointer',
              color: 'var(--text-2)',
              display: 'flex',
              alignItems: 'center',
              lineHeight: 1,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Monaco Editor */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <Editor
            height="100%"
            language="json"
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            value={editorValue}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 12.5,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              tabSize: 2,
              formatOnPaste: true,
              automaticLayout: true,
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
              padding: { top: 8 },
            }}
          />
        </div>

        {/* Error bar */}
        {parseError && (
          <div
            data-testid="json-panel-error"
            style={{
              padding: '8px 12px',
              background: 'var(--danger-bg)',
              borderTop: '1px solid var(--danger-border)',
              color: 'var(--danger)',
              fontSize: 11.5,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={13} />
            {parseError}
          </div>
        )}
      </div>
    </>
  )
}
