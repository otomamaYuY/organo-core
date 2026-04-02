import { useState, useRef, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useLocaleStore } from '@/store/useLocaleStore'
import { toAscii } from '@/utils/asciiFilter'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  /** Existing values from other nodes used as autocomplete suggestions */
  suggestions?: string[]
}

export function TagInput({ tags, onChange, suggestions = [] }: TagInputProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const t = useT()
  const locale = useLocaleStore(s => s.locale)

  const addTag = (value?: string) => {
    const trimmed = (value ?? input).trim()
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      onChange([...tags, trimmed])
      setInput('')
      setShowSuggestions(false)
    }
  }

  const removeTag = (tag: string) => onChange(tags.filter(t => t !== tag))

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) removeTag(tags[tags.length - 1])
    if (e.key === 'Escape') setShowSuggestions(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = locale === 'en' ? toAscii(e.target.value) : e.target.value
    setInput(val)
    setShowSuggestions(val.trim().length > 0)
  }

  const handleBlur = () => {
    // Delay so suggestion clicks register before blur hides them
    setTimeout(() => {
      addTag()
      setShowSuggestions(false)
    }, 150)
  }

  // Suggestions: match input, exclude already-added tags
  const matchingSuggestions = input.trim()
    ? suggestions.filter(
        s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s),
      )
    : []

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '5px 7px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          minHeight: 36,
        }}
      >
        {tags.map(tag => (
          <span
            key={tag}
            style={{
              background: 'var(--accent-bg)',
              border: '1px solid var(--accent-border)',
              borderRadius: 4,
              padding: '1px 6px',
              fontSize: 12,
              color: 'var(--accent-text)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                color: 'var(--text-3)',
                display: 'flex',
              }}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => input.trim() && setShowSuggestions(true)}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? t('tagPlaceholder') : ''}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontSize: 12,
            flex: 1,
            minWidth: 80,
            padding: 0,
          }}
        />
      </div>

      {/* Suggestion dropdown */}
      {showSuggestions && matchingSuggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 2,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
            padding: '4px 6px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
          }}
        >
          {matchingSuggestions.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={e => {
                e.preventDefault() // prevent blur from firing first
                addTag(s)
              }}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 11,
                color: 'var(--text-2)',
                cursor: 'pointer',
                lineHeight: 1.6,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
