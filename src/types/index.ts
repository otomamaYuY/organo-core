import type { Node, Edge } from 'reactflow'

// ─── NodeKind ────────────────────────────────────────
export type NodeKind = 'person' | 'org-unit'

// ─── Person Node ─────────────────────────────────────
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'intern' | 'advisor'

export interface OrgPersonData {
  kind: 'person'
  name: string
  role: string
  department: string
  image?: string
  email?: string
  phone?: string
  employmentType?: EmploymentType
  tags?: string[]
  isCollapsed?: boolean
  childCount?: number
}

// ─── Org Unit Node ────────────────────────────────────
export type OrgUnitType =
  | 'company'
  | 'headquarters'
  | 'bureau'
  | 'department'
  | 'division'
  | 'section'
  | 'unit'
  | 'post'

export const ORG_UNIT_TYPE_LABELS: Record<OrgUnitType, string> = {
  company: '会社',
  headquarters: '本部',
  bureau: '局',
  department: '部',
  division: '室・事業部',
  section: '課',
  unit: '係・チーム',
  post: '担当',
}

export interface OrgUnitData {
  kind: 'org-unit'
  unitName: string
  unitType: OrgUnitType
  headPersonName?: string
  memberCount?: number
  description?: string
  tags?: string[]
  isCollapsed?: boolean
  childCount?: number
}

// ─── Union ───────────────────────────────────────────
export type OrgNodeData = OrgPersonData | OrgUnitData

export interface OrgNode extends Node<OrgNodeData> {
  type: 'orgNode'
}

// ─── Type Guards ─────────────────────────────────────
export function isPersonNode(node: OrgNode): node is OrgNode & { data: OrgPersonData } {
  return node.data.kind === 'person'
}

export function isUnitNode(node: OrgNode): node is OrgNode & { data: OrgUnitData } {
  return node.data.kind === 'org-unit'
}

// ─── Edge ────────────────────────────────────────────
export type RelationshipType = 'reports-to' | 'dotted-line' | 'advisory'

export interface OrgEdgeData {
  relationshipType?: RelationshipType
}

export type OrgEdge = Edge<OrgEdgeData>

// ─── Context Menu ─────────────────────────────────────
export interface ContextMenuState {
  x: number
  y: number
  nodeId: string
}
