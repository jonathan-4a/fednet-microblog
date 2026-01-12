import { apiRequest } from './apiClient'
import { buildQueryString } from '../utils/queryParams'
import { useAuthStore } from '../stores/authStore'
import type {
  UpdateProfileRequest,
  InviteTokenResponse,
  UserProfileOutput,
  SearchUsersResponse,
} from '../types/user'

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

// GET /api/users/me
export async function getUserProfile(): Promise<UserProfileOutput> {
  const response = (await apiRequest(
    '/api/users/me',
    { headers: getAuthHeaders() }
  )) as UserProfileOutput | undefined
  if (!response) throw new Error('No response from server')
  return response
}

// PATCH /api/users/me
export async function updateProfile(
  data: UpdateProfileRequest
): Promise<UserProfileOutput> {
  const response = (await apiRequest(
    '/api/users/me',
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  )) as UserProfileOutput | undefined
  if (!response) throw new Error('No response from server')
  return response
}

// DELETE /api/users/me
export async function deleteAccount(): Promise<void> {
  await apiRequest(
    '/api/users/me',
    { method: 'DELETE', headers: getAuthHeaders() }
  )
}

// POST /api/users/me/invites
export async function generateInvite(): Promise<InviteTokenResponse> {
  const response = (await apiRequest(
    '/api/users/me/invites',
    {
      method: 'POST',
      headers: getAuthHeaders(),
    }
  )) as InviteTokenResponse | undefined
  if (!response) throw new Error('No response from server')
  return response
}

// GET /api/users/search
export async function searchUsers(params?: {
  q?: string
  limit?: number
}): Promise<UserProfileOutput[]> {
  const query = buildQueryString(params || {})
  const token = useAuthStore.getState().token
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = (await apiRequest(
    `/api/users/search${query}`,
    { headers }
  )) as SearchUsersResponse | undefined

  return response?.users || []
}

