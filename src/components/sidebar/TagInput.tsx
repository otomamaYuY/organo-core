import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { useT } from '@/hooks/useT'
import { useLocaleStore } from '@/store/useLocaleStore'
import { toAscii } from '@/utils/asciiFilter'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
}

export function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState('')
  const t = useT()
  const locale = useLocaleStore(s => s.locale)

  const addTag = () => {
    const trimmed = input.trim()
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      onChange([...tags, trimmed])
      setInput('')
    }
  }

  const removeTag = (tag: string) => onChange(tags.filter(t => t !== tag))

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) removeTag(tags[tags.length - 1])
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(locale === 'en' ? toAscii(e.target.value) : e.target.value)
  }

  return (
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
        onBlur={addTag}
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
  )
}
