import type { OrgNode, OrgEdge, OrgPersonData, OrgUnitData } from '@/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getTimestamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  )
}

export function downloadText(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── ① JSON Tree ────────────────────────────────────────────────────────────

export interface TreeNode {
  id: string
  kind: 'person' | 'org-unit'
  // person fields
  name?: string
  role?: string
  department?: string
  email?: string
  phone?: string
  employmentType?: string
  image?: string
  tags?: string[]
  // org-unit fields
  unitName?: string
  unitType?: string
  headPersonName?: string
  memberCount?: number
  description?: string
  // tree
  children: TreeNode[]
}

function nodeToTreeNode(
  node: OrgNode,
  childrenMap: Map<string, string[]>,
  nodeMap: Map<string, OrgNode>,
): TreeNode {
  const d = node.data
  const childIds = childrenMap.get(node.id) ?? []
  const children = childIds
    .map(id => nodeMap.get(id))
    .filter((n): n is OrgNode => n !== undefined)
    .map(n => nodeToTreeNode(n, childrenMap, nodeMap))

  const base = { id: node.id, kind: d.kind, children }

  if (d.kind === 'person') {
    const p = d as OrgPersonData
    return {
      ...base,
      name: p.name,
      role: p.role,
      department: p.department,
      email: p.email,
      phone: p.phone,
      employmentType: p.employmentType,
      image: p.image,
      tags: p.tags,
    }
  } else {
    const u = d as OrgUnitData
    return {
      ...base,
      unitName: u.unitName,
      unitType: u.unitType,
      headPersonName: u.headPersonName,
      memberCount: u.memberCount,
      description: u.description,
      tags: u.tags,
    }
  }
}

export function buildTreeJson(nodes: OrgNode[], edges: OrgEdge[]): TreeNode[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const childrenMap = new Map<string, string[]>()
  const hasParent = new Set<string>()

  for (const edge of edges) {
    if (!childrenMap.has(edge.source)) childrenMap.set(edge.source, [])
    childrenMap.get(edge.source)!.push(edge.target)
    hasParent.add(edge.target)
  }

  const roots = nodes.filter(n => !hasParent.has(n.id))
  return roots.map(n => nodeToTreeNode(n, childrenMap, nodeMap))
}

// ─── ② Flat CSV ─────────────────────────────────────────────────────────────

function csvCell(value: string | number | undefined | null): string {
  const str = value == null ? '' : String(value)
  // RFC 4180: wrap in quotes if contains comma, newline, or double-quote
  if (/[",\r\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

const CSV_HEADERS = [
  'ID',
  'Parent ID',
  'Kind',
  'Name',
  'Role / UnitType',
  'Department',
  'EmploymentType',
  'Email',
  'Phone',
  'UnitType',
  'HeadPersonName',
  'MemberCount',
  'Description',
  'Tags',
]

export function buildFlatCsv(nodes: OrgNode[], edges: OrgEdge[]): string {
  // Build parent lookup: childId → parentId
  const parentMap = new Map<string, string>()
  for (const edge of edges) parentMap.set(edge.target, edge.source)

  const rows: string[] = [CSV_HEADERS.map(csvCell).join(',')]

  for (const node of nodes) {
    const d = node.data
    const parentId = parentMap.get(node.id) ?? ''

    if (d.kind === 'person') {
      const p = d as OrgPersonData
      rows.push(
        [
          csvCell(node.id),
          csvCell(parentId),
          csvCell('person'),
          csvCell(p.name),
          csvCell(p.role),
          csvCell(p.department),
          csvCell(p.employmentType),
          csvCell(p.email),
          csvCell(p.phone),
          csvCell(''), // UnitType
          csvCell(''), // HeadPersonName
          csvCell(''), // MemberCount
          csvCell(''), // Description
          csvCell((p.tags ?? []).join('; ')),
        ].join(','),
      )
    } else {
      const u = d as OrgUnitData
      rows.push(
        [
          csvCell(node.id),
          csvCell(parentId),
          csvCell('org-unit'),
          csvCell(u.unitName),
          csvCell(u.unitType),
          csvCell(''), // Department
          csvCell(''), // EmploymentType
          csvCell(''), // Email
          csvCell(''), // Phone
          csvCell(u.unitType),
          csvCell(u.headPersonName),
          csvCell(u.memberCount),
          csvCell(u.description),
          csvCell((u.tags ?? []).join('; ')),
        ].join(','),
      )
    }
  }

  // UTF-8 BOM for Excel compatibility
  return '\uFEFF' + rows.join('\r\n')
}

// ─── ③ Standalone HTML ──────────────────────────────────────────────────────

const EMPLOYMENT_LABELS: Record<string, string> = {
  'full-time': '正社員',
  'part-time': 'パート',
  contract: '業務委託',
  intern: 'インターン',
  advisor: 'アドバイザー',
}

const UNIT_TYPE_LABELS: Record<string, string> = {
  company: '会社・法人',
  headquarters: '本部',
  bureau: '局',
  department: '部',
  division: '室・事業部',
  section: '課',
  unit: '係・チーム',
  post: '担当',
}

function escHtml(s: string | undefined | null): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderHtmlNode(
  node: OrgNode,
  childrenMap: Map<string, string[]>,
  nodeMap: Map<string, OrgNode>,
  depth: number,
): string {
  const d = node.data
  const childIds = childrenMap.get(node.id) ?? []

  let cardHtml = ''
  if (d.kind === 'person') {
    const p = d as OrgPersonData
    const empLabel = p.employmentType
      ? (EMPLOYMENT_LABELS[p.employmentType] ?? p.employmentType)
      : ''
    cardHtml = `
      <div class="card person-card">
        <div class="card-name">${escHtml(p.name)}</div>
        <div class="card-role">${escHtml(p.role)}</div>
        ${p.department ? `<div class="card-dept">${escHtml(p.department)}</div>` : ''}
        ${empLabel ? `<span class="badge badge-emp">${escHtml(empLabel)}</span>` : ''}
        ${p.email ? `<div class="card-meta">${escHtml(p.email)}</div>` : ''}
        ${p.phone ? `<div class="card-meta">${escHtml(p.phone)}</div>` : ''}
      </div>`
  } else {
    const u = d as OrgUnitData
    const typeLabel = UNIT_TYPE_LABELS[u.unitType] ?? u.unitType
    cardHtml = `
      <div class="card unit-card">
        <div class="card-name">${escHtml(u.unitName)}</div>
        <span class="badge badge-unit">${escHtml(typeLabel)}</span>
        ${u.headPersonName ? `<div class="card-role">長: ${escHtml(u.headPersonName)}</div>` : ''}
        ${u.memberCount != null ? `<div class="card-meta">${u.memberCount} 名</div>` : ''}
        ${u.description ? `<div class="card-desc">${escHtml(u.description)}</div>` : ''}
      </div>`
  }

  const childrenHtml =
    childIds.length > 0
      ? `<ul>${childIds
          .map(id => nodeMap.get(id))
          .filter((n): n is OrgNode => n !== undefined)
          .map(n => renderHtmlNode(n, childrenMap, nodeMap, depth + 1))
          .join('')}</ul>`
      : ''

  return `<li>${cardHtml}${childrenHtml}</li>`
}

export function buildStandaloneHtml(nodes: OrgNode[], edges: OrgEdge[]): string {
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const childrenMap = new Map<string, string[]>()
  const hasParent = new Set<string>()

  for (const edge of edges) {
    if (!childrenMap.has(edge.source)) childrenMap.set(edge.source, [])
    childrenMap.get(edge.source)!.push(edge.target)
    hasParent.add(edge.target)
  }

  const roots = nodes.filter(n => !hasParent.has(n.id))
  const bodyHtml = roots
    .map(n => `<ul class="tree">${renderHtmlNode(n, childrenMap, nodeMap, 0)}</ul>`)
    .join('\n')

  const generatedAt = new Date().toLocaleString('ja-JP')

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>組織図</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Hiragino Sans', 'Meiryo', 'Yu Gothic', sans-serif;
      font-size: 13px;
      color: #1a1a1a;
      background: #fff;
      padding: 32px 24px 48px;
    }

    h1 {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    .meta {
      font-size: 11px;
      color: #888;
      margin-bottom: 32px;
    }

    /* ── CSS Family Tree ─────────────────────────── */
    .tree, .tree ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0;
    }

    .tree li {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      position: relative;
    }

    /* Children are laid out horizontally */
    .tree li > ul {
      flex-direction: row;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 0;
      padding-top: 24px;
      margin-left: 0;
    }

    .tree li > ul > li {
      padding: 0 16px;
      position: relative;
    }

    /* Vertical connector from parent card to horizontal bar */
    .tree li > ul::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 2px;
      height: 16px;
      background: #c8cdd6;
    }

    /* Horizontal bar connecting siblings */
    .tree li > ul > li::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: #c8cdd6;
    }

    .tree li > ul > li:first-child::before { left: 50%; }
    .tree li > ul > li:last-child::before  { right: 50%; }
    .tree li > ul > li:first-child:last-child::before { display: none; }

    /* Vertical connector from horizontal bar to each child */
    .tree li > ul > li::after {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 2px;
      height: 16px;
      background: #c8cdd6;
    }

    /* ── Cards ──────────────────────────────────── */
    .card {
      background: #fff;
      border: 1.5px solid #d0d4db;
      border-radius: 8px;
      padding: 10px 14px;
      min-width: 160px;
      max-width: 220px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.07);
      position: relative;
      z-index: 1;
    }

    .person-card { border-left: 4px solid #2563eb; }
    .unit-card   { border-left: 4px solid #64748b; }

    .card-name {
      font-size: 13px;
      font-weight: 700;
      color: #111;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .card-role {
      font-size: 11px;
      color: #555;
      margin-bottom: 3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .card-dept {
      font-size: 11px;
      color: #2563eb;
      margin-bottom: 3px;
    }
    .card-meta {
      font-size: 10px;
      color: #999;
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .card-desc {
      font-size: 10px;
      color: #666;
      margin-top: 4px;
      line-height: 1.4;
    }

    .badge {
      display: inline-block;
      border-radius: 3px;
      padding: 1px 6px;
      font-size: 10px;
      font-weight: 600;
      margin-top: 3px;
    }
    .badge-emp  { background: #f0fdf4; color: #15803d; border: 1px solid #86efac; }
    .badge-unit { background: #f8fafc; color: #475569; border: 1px solid #cbd5e1; }

    /* Root level spacing */
    .tree { overflow-x: auto; padding-bottom: 8px; }

    @media print {
      body { padding: 16px; }
      .card { box-shadow: none; }
    }
  </style>
</head>
<body>
  <h1>組織図</h1>
  <p class="meta">出力日時: ${generatedAt}</p>
  ${bodyHtml}
</body>
</html>`
}
