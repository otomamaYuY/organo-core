import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSearch } from '@/hooks/useSearch'
import type { OrgNode } from '@/types'

const mockNodes: OrgNode[] = [
  {
    id: '1',
    type: 'orgNode',
    position: { x: 0, y: 0 },
    data: { kind: 'person', name: '田中太郎', role: '課長', department: '経理', tags: [] },
  },
  {
    id: '2',
    type: 'orgNode',
    position: { x: 0, y: 0 },
    data: { kind: 'org-unit', unitName: '人事部', unitType: 'department', tags: ['HR'] },
  },
]

describe('useSearch', () => {
  it('returns empty set when query is empty', () => {
    const { result } = renderHook(() => useSearch(mockNodes, ''))
    expect(result.current.size).toBe(0)
  })

  it('finds person by name', () => {
    const { result } = renderHook(() => useSearch(mockNodes, '田中'))
    expect(result.current.has('1')).toBe(true)
    expect(result.current.has('2')).toBe(false)
  })

  it('finds org-unit by unitName', () => {
    const { result } = renderHook(() => useSearch(mockNodes, '人事'))
    expect(result.current.has('2')).toBe(true)
    expect(result.current.has('1')).toBe(false)
  })

  it('finds by tag', () => {
    const { result } = renderHook(() => useSearch(mockNodes, 'HR'))
    expect(result.current.has('2')).toBe(true)
  })
})
