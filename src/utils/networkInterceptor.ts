/**
 * Network Interceptor
 *
 * Monkey-patches window.fetch (and XMLHttpRequest as fallback) to automatically
 * capture every outbound request made by this app. Only external origins are
 * tracked — same-origin requests (Monaco workers, font files, etc.) are ignored.
 *
 * Call installNetworkInterceptor() once before the React tree mounts (main.tsx).
 * Safe to call multiple times: subsequent calls are no-ops.
 */

import { useNetworkStore } from '@/store/useNetworkStore'

let installed = false

/** Returns true if the URL is to an external origin (not the app itself). */
function isExternal(url: string): boolean {
  try {
    const u = new URL(url, window.location.href)
    return u.origin !== window.location.origin
  } catch {
    return false
  }
}

/** Builds a safe display label — strips query params & hash, masks auth tokens. */
function makeLabel(url: string): string {
  try {
    const u = new URL(url, window.location.href)
    return `${u.hostname}${u.pathname}`
  } catch {
    return url.slice(0, 80)
  }
}

let _seq = 0
function nextId(): string {
  return `req_${Date.now()}_${++_seq}`
}

export function installNetworkInterceptor(): void {
  if (installed) return
  installed = true

  // ── Patch window.fetch ──────────────────────────────────────────────────────
  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : (input as Request).url

    if (!isExternal(url)) {
      return originalFetch(input, init)
    }

    const { _addRequest, _completeRequest } = useNetworkStore.getState()
    const id = nextId()
    const method = init?.method ?? (input instanceof Request ? input.method : 'GET')

    _addRequest({
      id,
      method: method.toUpperCase(),
      url,
      label: makeLabel(url),
      status: null,
      startedAt: Date.now(),
      durationMs: null,
      bytes: null,
    })

    try {
      const response = await originalFetch(input, init)
      // Clone to read Content-Length without consuming body
      const bytes = response.headers.get('content-length')
        ? parseInt(response.headers.get('content-length')!, 10)
        : null
      _completeRequest(id, response.status, bytes)
      return response
    } catch (err) {
      // Network error (offline, CORS, etc.)
      _completeRequest(id, 0, null)
      throw err
    }
  }

  // ── Patch XMLHttpRequest (fallback, Monaco uses this) ──────────────────────
  const OriginalXHR = window.XMLHttpRequest
  class PatchedXHR extends OriginalXHR {
    private _xhrId: string = ''
    private _xhrUrl: string = ''

    open(method: string, url: string | URL, ...rest: Parameters<XMLHttpRequest['open']>[2 & 3 & 4 & 5 & number][]): void {
      this._xhrUrl = typeof url === 'string' ? url : url.href
      if (isExternal(this._xhrUrl)) {
        const { _addRequest } = useNetworkStore.getState()
        this._xhrId = nextId()
        _addRequest({
          id: this._xhrId,
          method: method.toUpperCase(),
          url: this._xhrUrl,
          label: makeLabel(this._xhrUrl),
          status: null,
          startedAt: Date.now(),
          durationMs: null,
          bytes: null,
        })

        this.addEventListener('loadend', () => {
          const { _completeRequest } = useNetworkStore.getState()
          const bytes = this.getResponseHeader('content-length')
            ? parseInt(this.getResponseHeader('content-length')!, 10)
            : (typeof this.response === 'string' ? new Blob([this.response]).size : null)
          _completeRequest(this._xhrId, this.status, bytes)
        })
      }
      // @ts-expect-error - spread rest args
      super.open(method, url, ...rest)
    }
  }
  window.XMLHttpRequest = PatchedXHR as typeof XMLHttpRequest
}
