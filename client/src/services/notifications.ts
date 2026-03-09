// src/services/notifications.ts
import { apiRequest } from './apiClient'
import { useAuthStore } from '../stores/authStore'
import type { NotificationsListResponse } from '../types/notifications'

function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token
  if (!token) {
    throw new Error('No authentication token found')
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

// GET /api/notifications
export async function getNotifications(params?: {
  limit?: number
  offset?: number
}): Promise<NotificationsListResponse> {
  const search = new URLSearchParams()
  if (params?.limit != null) search.set('limit', String(params.limit))
  if (params?.offset != null) search.set('offset', String(params.offset))
  const query = search.toString()
  const url = query ? `/api/notifications?${query}` : '/api/notifications'
  return (await apiRequest(url, { headers: getAuthHeaders() })) as NotificationsListResponse
}

// PATCH /api/notifications/:id/read
export async function markNotificationRead(id: number): Promise<void> {
  await apiRequest(`/api/notifications/${id}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  })
}

// PATCH /api/notifications/read
export async function markAllNotificationsRead(): Promise<{ marked: number }> {
  return (await apiRequest('/api/notifications/read', {
    method: 'PATCH',
    headers: getAuthHeaders(),
  })) as { marked: number }
}
