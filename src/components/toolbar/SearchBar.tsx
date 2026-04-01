import { Search, X } from 'lucide-react'
import { useOrgStore } from '@/store/useOrgStore'
import { useLocaleStore } from '@/store/useLocaleStore'
import { useT } from '@/hooks/useT'
import { toAscii } from '@/utils/asciiFilter'

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useOrgStore()
  const locale = useLocaleStore(s => s.locale)
  const t = useT()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = locale === 'en' ? toAscii(e.target.value) : e.target.value
    setSearchQuery(value)
  }

  return (
    <div style={{ position: 'relative', width: 260, flexShrink: 0 }}>
      <Search
        size={14}
        style={{
          position: 'absolute',
          left: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-3)',
          pointerEvents: 'none',
        }}
      />
      <input
        value={searchQuery}
        onChange={handleChange}
        placeholder={t('searchPlaceholder')}
        style={{
          width: '100%',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 7,
          padding: '7px 32px 7px 30px',
          color: 'var(--text)',
          fontSize: 13,
          outline: 'none',
        }}
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-3)',
            display: 'flex',
            padding: 0,
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
