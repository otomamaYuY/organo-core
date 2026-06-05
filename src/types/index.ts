import type { Node, Edge } from 'reactflow'

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

export interface OrgUnitData {
  kind: 'org-unit'
  unitName: string
  unitType: OrgUnitType
  headPersonName?: string
  memberCount?: number
  childUnitCount?: number
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
