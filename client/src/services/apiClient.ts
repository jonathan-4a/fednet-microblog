// src/services/apiClient.ts
import { API_BASE } from '../config'

export async function apiRequest(url: string, options: RequestInit = {}) {
  const finalUrl = `${API_BASE}${url}`

  const res = await fetch(finalUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    try {
      const data = JSON.parse(text) as { error?: string; message?: string }

      // Prefer human-friendly message from the server when available,
      // and only fall back to the raw error code/text if needed.
      const msg =
        (typeof data.message === 'string' && data.message.trim()) ||
        (typeof data.error === 'string' && data.error.trim()) ||
        text

      throw new Error(msg)
    } catch (e) {
      if (e instanceof SyntaxError) throw new Error(text || res.statusText)
      throw e
    }
  }

  if (res.status === 204) return undefined

  const text = await res.text()
  return text ? JSON.parse(text) : undefined
}


