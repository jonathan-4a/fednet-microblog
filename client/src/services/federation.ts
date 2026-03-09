// src/services/federation.ts
import type { Actor, OrderedCollection } from '../types/activitypub'
import { fetchResource } from './proxy'

// GET /u/{username}
export async function getActor(actorUrl: string): Promise<Actor> {
  return fetchResource<Actor>(actorUrl)
}

// GET /u/{username}/outbox
export async function getOutbox(
  outboxUrl: string,
  params?: { page?: number; limit?: number }
): Promise<OrderedCollection> {
  const queryParams = new URLSearchParams()
  if (params?.page !== undefined) {
    queryParams.append('page', params.page.toString())
  }
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString())
  }
  const query = queryParams.toString()
  const url = query ? `${outboxUrl}?${query}` : outboxUrl

  return fetchResource<OrderedCollection>(url)
}

// POST /u/{username}/outbox
export async function postOutbox(
  username: string,
  activity: Record<string, unknown>
): Promise<{ status: string }> {
  const { useAuthStore } = await import('../stores/authStore')
  const token = useAuthStore.getState().token
  if (!token) {
    throw new Error('No authentication token found')
  }

  const { API_BASE } = await import('../config')
  const url = `${API_BASE}/u/${username}/outbox`

  const headers: Record<string, string> = {
    'Content-Type': 'application/activity+json',
    Accept: 'application/activity+json',
    Authorization: `Bearer ${token}`,
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(activity),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[postOutbox]', response.status, errorText)
    try {
      const parsed = JSON.parse(errorText) as { error?: string; message?: string }
      const msg = parsed.error ?? parsed.message ?? errorText
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } catch (e) {
      if (e instanceof SyntaxError) throw new Error(errorText)
      throw e
    }
  }

  const data = await response.json()
  return data as { status: string }
}

