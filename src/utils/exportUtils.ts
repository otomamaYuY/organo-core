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

/**
 * Render a single node as a horizontal tree row.
 * Uses <details> for click-to-reveal additional information.
 * Layout: [card] ── [children stacked vertically to the right]
 */
function renderHtmlNode(
  node: OrgNode,
  childrenMap: Map<string, string[]>,
  nodeMap: Map<string, OrgNode>,
  depth: number,
): string {
  const d = node.data
  const childIds = childrenMap.get(node.id) ?? []
  const hasChildren = childIds.length > 0

  // Build the card summary (always visible) and detail (click to reveal)
  let summaryLabel = ''
  let detailHtml = ''

  if (d.kind === 'person') {
    const p = d as OrgPersonData
    const empLabel = p.employmentType
      ? (EMPLOYMENT_LABELS[p.employmentType] ?? p.employmentType)
      : ''
    summaryLabel = escHtml(p.name)
    if (p.role) summaryLabel += `<span class="card-role">${escHtml(p.role)}</span>`

    const detailRows: string[] = []
    if (p.department) detailRows.push(`<tr><th>部署</th><td>${escHtml(p.department)}</td></tr>`)
    if (empLabel) detailRows.push(`<tr><th>雇用形態</th><td>${escHtml(empLabel)}</td></tr>`)
    if (p.email) detailRows.push(`<tr><th>メール</th><td>${escHtml(p.email)}</td></tr>`)
    if (p.phone) detailRows.push(`<tr><th>電話</th><td>${escHtml(p.phone)}</td></tr>`)
    if (p.tags && p.tags.length > 0) {
      detailRows.push(`<tr><th>タグ</th><td>${p.tags.map(t => escHtml(t)).join(', ')}</td></tr>`)
    }
    if (detailRows.length > 0) {
      detailHtml = `<table class="detail-table">${detailRows.join('')}</table>`
    }
  } else {
    const u = d as OrgUnitData
    const typeLabel = UNIT_TYPE_LABELS[u.unitType] ?? u.unitType
    summaryLabel = escHtml(u.unitName)
    summaryLabel += `<span class="card-type">${escHtml(typeLabel)}</span>`

    const detailRows: string[] = []
    if (u.headPersonName) detailRows.push(`<tr><th>責任者</th><td>${escHtml(u.headPersonName)}</td></tr>`)
    if (u.memberCount != null) detailRows.push(`<tr><th>人数</th><td>${u.memberCount} 名</td></tr>`)
    if (u.description) detailRows.push(`<tr><th>説明</th><td>${escHtml(u.description)}</td></tr>`)
    if (u.tags && u.tags.length > 0) {
      detailRows.push(`<tr><th>タグ</th><td>${u.tags.map(t => escHtml(t)).join(', ')}</td></tr>`)
    }
    if (detailRows.length > 0) {
      detailHtml = `<table class="detail-table">${detailRows.join('')}</table>`
    }
  }

  const kindClass = d.kind === 'person' ? 'node--person' : 'node--unit'

  // Build card HTML using <details> for interactivity
  const cardInner = detailHtml
    ? `<details class="card ${kindClass}"><summary class="card-summary">${summaryLabel}</summary>${detailHtml}</details>`
    : `<div class="card ${kindClass}"><div class="card-summary">${summaryLabel}</div></div>`

  // Build children
  const childrenHtml = hasChildren
    ? `<div class="children">${childIds
        .map(id => nodeMap.get(id))
        .filter((n): n is OrgNode => n !== undefined)
        .map(n => renderHtmlNode(n, childrenMap, nodeMap, depth + 1))
        .join('')}</div>`
    : ''

  return `<div class="row">${cardInner}${childrenHtml}</div>`
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
    .map(n => renderHtmlNode(n, childrenMap, nodeMap, 0))
    .join('\n')

  const generatedAt = new Date().toLocaleString('ja-JP')
  const personCount = nodes.filter(n => n.data.kind === 'person').length
  const unitCount = nodes.filter(n => n.data.kind === 'org-unit').length

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>組織図</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Noto Sans JP', 'Hiragino Sans', 'Meiryo', sans-serif;
      font-size: 13px;
      line-height: 1.5;
      color: #222;
      background: #fff;
    }

    /* ── Header ──────────────────────────────────────── */
    .page-header {
      border-bottom: 2px solid #222;
      padding: 24px 32px 16px;
    }
    .page-title {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .page-meta {
      display: flex;
      gap: 20px;
      margin-top: 6px;
      font-size: 11px;
      color: #666;
    }

    /* ── Chart Container ─────────────────────────────── */
    .chart-wrap {
      padding: 32px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    /* ── Horizontal Tree Layout ──────────────────────── */
    /*
     * Structure:
     *   .row  = flex row: [card] → [children]
     *   .children = vertical stack of child .rows
     *
     * Connector lines use ::before / ::after pseudo-elements
     * to draw right-angle connectors from parent to children.
     */
    .row {
      display: flex;
      align-items: flex-start;
    }

    .children {
      display: flex;
      flex-direction: column;
      position: relative;
      margin-left: 0;
    }

    .children > .row {
      position: relative;
      padding-left: 32px;
    }

    /* Horizontal connector from parent card to children column */
    .children > .row::before {
      content: '';
      position: absolute;
      left: 0;
      top: 14px;
      width: 32px;
      height: 1.5px;
      background: #555;
    }

    /* Vertical line connecting siblings */
    .children > .row::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 1.5px;
      height: 100%;
      background: #555;
    }

    /* First child: vertical line starts from connector point */
    .children > .row:first-child::after {
      top: 14px;
    }

    /* Last child: vertical line ends at connector point */
    .children > .row:last-child::after {
      height: 15px;
    }

    /* Only child: no vertical line needed */
    .children > .row:first-child:last-child::after {
      display: none;
    }

    /* ── Cards ────────────────────────────────────────── */
    .card {
      border: 1.5px solid #333;
      background: #fff;
      min-width: 120px;
      max-width: 220px;
      margin: 4px 0;
      flex-shrink: 0;
      position: relative;
    }

    .card-summary {
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 500;
      color: #222;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      list-style: none;       /* Remove default <details> marker */
    }
    .card-summary::-webkit-details-marker { display: none; }

    /* Hover feedback */
    details.card > .card-summary:hover {
      background: #f5f5f5;
    }

    /* Open state indicator */
    details.card[open] {
      border-color: #111;
    }
    details.card[open] > .card-summary {
      border-bottom: 1px solid #ddd;
      background: #fafafa;
    }

    /* Role / type label inline */
    .card-role {
      font-size: 10px;
      font-weight: 400;
      color: #888;
      margin-left: auto;
      white-space: nowrap;
    }
    .card-type {
      font-size: 10px;
      font-weight: 400;
      color: #888;
      margin-left: auto;
      white-space: nowrap;
    }

    /* Click hint arrow */
    details.card > .card-summary::after {
      content: '\\25BC';
      font-size: 8px;
      color: #bbb;
      margin-left: 4px;
      transition: transform 0.2s;
    }
    details.card[open] > .card-summary::after {
      transform: rotate(180deg);
    }

    /* ── Detail Table (revealed on click) ────────────── */
    .detail-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .detail-table th,
    .detail-table td {
      padding: 4px 14px;
      text-align: left;
      border-bottom: 1px solid #f0f0f0;
    }
    .detail-table th {
      font-weight: 500;
      color: #888;
      width: 72px;
      white-space: nowrap;
    }
    .detail-table td {
      color: #333;
    }
    .detail-table tr:last-child th,
    .detail-table tr:last-child td {
      border-bottom: none;
    }

    /* ── Node kind accent ─────────────────────────────── */
    .node--person {
      border-left: 3px solid #333;
    }
    .node--unit {
      border-left: 3px solid #888;
      background: #fafafa;
    }

    /* ── Footer ───────────────────────────────────────── */
    .page-footer {
      border-top: 1px solid #ddd;
      padding: 16px 32px;
      font-size: 10px;
      color: #999;
      text-align: right;
    }

    /* ── Responsive ───────────────────────────────────── */
    @media (max-width: 640px) {
      .chart-wrap { padding: 16px; }
      .card { max-width: 180px; min-width: 100px; }
      .card-summary { font-size: 12px; padding: 5px 10px; }
      .children > .row { padding-left: 24px; }
      .children > .row::before { width: 24px; }
    }

    /* ── Print ────────────────────────────────────────── */
    @media print {
      body { font-size: 10px; }
      .chart-wrap { padding: 8px; overflow: visible; }
      details.card { open: true; }
      details.card[open] > .card-summary::after { display: none; }
      .card { break-inside: avoid; }
      .page-header { border-bottom-width: 1px; padding: 12px 16px 8px; }
      .page-footer { padding: 8px 16px; }
    }
  </style>
</head>
<body>
  <header class="page-header">
    <div class="page-title">組織図</div>
    <div class="page-meta">
      <span>出力日時: ${generatedAt}</span>
      <span>メンバー: ${personCount} 名</span>
      <span>組織: ${unitCount}</span>
    </div>
  </header>
  <div class="chart-wrap">
    ${bodyHtml}
  </div>
  <footer class="page-footer">
    Exported from Organogram &middot; ${generatedAt}
  </footer>
</body>
</html>`
}
