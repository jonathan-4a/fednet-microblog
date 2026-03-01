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
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || res.statusText)
  }

  if (res.status === 204) return undefined

  const text = await res.text()
  return text ? JSON.parse(text) : undefined
}


