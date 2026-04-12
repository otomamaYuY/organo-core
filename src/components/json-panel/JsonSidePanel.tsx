import { useCallback, useEffect, useRef, useState } from 'react'
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react'
import type { editor as MonacoEditorNS } from 'monaco-editor'
import { X, Code2, AlertTriangle, ChevronLeft } from 'lucide-react'
import { useOrgStore } from '@/store/useOrgStore'
import { useJsonPanelStore } from '@/store/useJsonPanelStore'
import { useThemeStore } from '@/store/useThemeStore'
import type { OrgNode, OrgEdge } from '@/types'

const PANEL_WIDTH = 480
// Short trailing debounce so parsing is stable across bursts of keystrokes
// (80ms ≈ a natural pause between words) but commits feel near-instant.
const COMMIT_DEBOUNCE_MS = 80

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
  // `editorDirty` is the authoritative "user is mid-edit" signal. While true,
  // GUI-originated store changes do NOT overwrite the editor text, so the
  // user's in-progress typing is never stomped on. Cleared when the debounce
  // successfully commits a valid JSON, or when the panel is closed.
  const [editorDirty, setEditorDirty] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [triggerHovered, setTriggerHovered] = useState(false)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Captured in onMount so handleEditorChange can force the model's EOL
  // back to LF on every commit (Monaco occasionally flips to OS-default
  // CRLF when fed newline-free content via setValue).
  const modelRef = useRef<MonacoEditorNS.ITextModel | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const forceLfEol = useCallback(() => {
    const m = modelRef.current
    const mo = monacoRef.current
    if (m && mo) m.setEOL(mo.editor.EndOfLineSequence.LF)
  }, [])

  // Store → Editor sync. Runs only while the panel is visible AND the user
  // isn't actively editing the JSON. When the panel is closed we skip entirely
  // — the ~O(n) serialize cost is wasted if no one can see the result.
  useEffect(() => {
    if (!isOpen) return
    if (editorDirty) return
    forceLfEol()
    setEditorValue(serializeOrgData(nodes, edges))
    setParseError(null)
  }, [nodes, edges, isOpen, editorDirty, forceLfEol])

  // Closing the panel discards any in-progress (uncommitted) edit state so
  // the next time it's reopened the user sees the live store contents, not
  // stale text from a previous session.
  useEffect(() => {
    if (!isOpen) {
      setEditorDirty(false)
      setParseError(null)
    }
  }, [isOpen])

  // Editor → Store sync. Fires COMMIT_DEBOUNCE_MS after the last keystroke;
  // commits immediately on a valid JSON, keeps the dirty flag set while the
  // text is invalid so in-progress edits are preserved across GUI updates.
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value === undefined) return
      setEditorValue(value)
      setEditorDirty(true)

      if (debounceTimer.current) clearTimeout(debounceTimer.current)

      debounceTimer.current = setTimeout(() => {
        let parsed: unknown
        try {
          parsed = JSON.parse(value)
        } catch (e) {
          setParseError(e instanceof Error ? e.message : 'Invalid JSON')
          return // keep editorDirty so in-progress text survives GUI updates
        }
        if (
          !parsed ||
          typeof parsed !== 'object' ||
          !Array.isArray((parsed as { nodes?: unknown }).nodes) ||
          !Array.isArray((parsed as { edges?: unknown }).edges)
        ) {
          setParseError('JSON must contain "nodes" and "edges" arrays')
          return
        }
        const data = parsed as { nodes: OrgNode[]; edges: OrgEdge[] }
        // Normalize editor contents to the canonical serialization so the
        // follow-up store→editor effect is a strict-equal no-op and Monaco
        // doesn't trigger an extra executeEdits / cursor jump.
        forceLfEol()
        setEditorValue(serializeOrgData(data.nodes, data.edges))
        setParseError(null)
        setEditorDirty(false)
        importFromJson(data)
      }, COMMIT_DEBOUNCE_MS)
    },
    [importFromJson, forceLfEol],
  )

  const handleMount: OnMount = useCallback((editor, monaco) => {
    monacoRef.current = monaco
    const model = editor.getModel()
    if (model) {
      modelRef.current = model
      // Force LF end-of-line to match our JSON.stringify output. Without
      // this, Monaco defaults to CRLF on Windows, so the `value` prop (LF)
      // differs from the editor's internal text (CRLF) on every sync pass
      // and triggers a spurious executeEdits / cursor jump.
      model.setEOL(monaco.editor.EndOfLineSequence.LF)
    }
  }, [])

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  return (
    <>
      {/* Edge trigger — vertical tab handle on the right edge */}
      <button
        type="button"
        data-testid="json-panel-trigger"
        aria-label="Open JSON editor"
        title="JSON エディタを開く"
        onMouseEnter={() => setTriggerHovered(true)}
        onMouseLeave={() => setTriggerHovered(false)}
        onClick={togglePanel}
        className={!isOpen && !triggerHovered ? 'json-trigger-pulse' : undefined}
        style={{
          position: 'absolute',
          top: '50%',
          right: 0,
          transform: isOpen
            ? 'translate(100%, -50%)'
            : triggerHovered
              ? 'translate(-4px, -50%)'
              : 'translate(0, -50%)',
          width: 38,
          height: 132,
          padding: 0,
          zIndex: 20,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          paddingTop: 14,
          paddingBottom: 14,
          background: triggerHovered ? 'var(--accent)' : 'var(--surface-2)',
          color: triggerHovered ? '#FFFFFF' : 'var(--accent-text)',
          border: '1px solid var(--accent-border)',
          borderRight: 'none',
          borderTopLeftRadius: 12,
          borderBottomLeftRadius: 12,
          transition:
            'transform 0.22s cubic-bezier(0.4,0,0.2,1), background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease',
          pointerEvents: isOpen ? 'none' : 'auto',
        }}
      >
        <ChevronLeft size={18} strokeWidth={2.5} />
        <Code2 size={18} strokeWidth={2.25} />
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            lineHeight: 1,
          }}
        >
          JSON
        </span>
      </button>

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
            onMount={handleMount}
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
