import { create } from 'zustand'

/**
 * Tracks outbound network requests initiated by this app.
 * The ONLY caller is src/services/llm/openai.ts (OpenAI image import).
 * Chrome AI (Gemini Nano) is fully on-device and never calls begin/end.
 *
 * Usage from non-React context:
 *   useNetworkStore.getState().begin()
 *   useNetworkStore.getState().end()
 */

interface NetworkState {
  /** Number of in-flight requests */
  activeCount: number
  /** Timestamp of last completed request (ms since epoch) */
  lastActivityAt: number | null
  begin: () => void
  end: () => void
}

export const useNetworkStore = create<NetworkState>(set => ({
  activeCount: 0,
  lastActivityAt: null,

  begin: () =>
    set(s => ({
      activeCount: s.activeCount + 1,
    })),

  end: () =>
    set(s => ({
      activeCount: Math.max(0, s.activeCount - 1),
      lastActivityAt: Date.now(),
    })),
}))
