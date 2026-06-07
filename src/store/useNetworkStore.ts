import { create } from 'zustand'

export interface NetworkRequest {
  id: string
  method: string
  url: string
  /** Display-friendly label: just the hostname + path (no auth tokens) */
  label: string
  status: number | null   // null = in-flight
  startedAt: number       // Date.now()
  durationMs: number | null
  /** Response size in bytes, if determinable */
  bytes: number | null
}

const MAX_LOG = 50

interface NetworkState {
  /** Number of currently in-flight requests to external origins */
  activeCount: number
  /** Chronological request log (newest first), capped at MAX_LOG */
  requests: NetworkRequest[]

  _addRequest: (req: NetworkRequest) => void
  _completeRequest: (id: string, status: number, bytes: number | null) => void
}

export const useNetworkStore = create<NetworkState>(set => ({
  activeCount: 0,
  requests: [],

  _addRequest: req =>
    set(s => ({
      activeCount: s.activeCount + 1,
      requests: [req, ...s.requests].slice(0, MAX_LOG),
    })),

  _completeRequest: (id, status, bytes) =>
    set(s => ({
      activeCount: Math.max(0, s.activeCount - 1),
      requests: s.requests.map(r =>
        r.id === id
          ? { ...r, status, bytes, durationMs: Date.now() - r.startedAt }
          : r,
      ),
    })),
}))
