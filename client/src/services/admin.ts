import { apiRequest } from './apiClient'
import { buildQueryString } from '../utils/queryParams'
import { useAuthStore } from '../stores/authStore'
import type {
  DashboardResponse,
  ListUsersRequest,
  AdminUsersListResponse,
  AdminUserSummary,
  UpdateUserRequest,
  AdminUserStatusResponse,
  DeleteUserResponse,
  ListPostsRequest,
  AdminPostsListResponse,
  AdminPostSummary,
  UpdatePostRequest as AdminUpdatePostRequest,
  DeletePostResponse as AdminDeletePostResponse,
  AdminServerSettings,
  UpdateSettingsRequest,
  InviteTokenRecord,
  RevokeInviteTokenResponse,
} from '../types/admin'

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

// GET /api/admin/dashboard
export async function getDashboard(): Promise<DashboardResponse> {
  return (await apiRequest('/api/admin/dashboard', {
    headers: getAuthHeaders(),
  })) as DashboardResponse
}

// GET /api/admin/users
export async function listUsers(
  params?: ListUsersRequest
): Promise<AdminUsersListResponse> {
  const query = buildQueryString(
    (params || {}) as Record<string, string | number | undefined>
  )
  const response = (await apiRequest(`/api/admin/users${query}`, {
    headers: getAuthHeaders(),
  })) as {
    items: AdminUsersListResponse['users']
    pagination: AdminUsersListResponse['pagination']
  }

  // Map API response (items) to expected format (users)
  return {
    users: response.items,
    pagination: response.pagination,
  }
}

// GET /api/admin/users/{id}
export async function getUser(id: string): Promise<AdminUserSummary> {
  return (await apiRequest(`/api/admin/users/${id}`, {
    headers: getAuthHeaders(),
  })) as AdminUserSummary
}

// PATCH /api/admin/users/{id}
export async function updateUser(
  id: string,
  data: UpdateUserRequest
): Promise<AdminUserStatusResponse> {
  return (await apiRequest(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })) as { msg: string; is_active: boolean }
}

// DELETE /api/admin/users/{id}
export async function deleteUser(id: string): Promise<DeleteUserResponse> {
  return (await apiRequest(`/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })) as DeleteUserResponse
}

// GET /api/admin/posts
export async function listPosts(
  params?: ListPostsRequest
): Promise<AdminPostsListResponse> {
  const query = buildQueryString(
    (params || {}) as Record<string, string | number | undefined>
  )
  const response = (await apiRequest(`/api/admin/posts${query}`, {
    headers: getAuthHeaders(),
  })) as {
    items: AdminPostsListResponse['posts']
    pagination: AdminPostsListResponse['pagination']
  }

  // Map API response (items) to expected format (posts)
  return {
    posts: response.items,
    pagination: response.pagination,
  }
}

// GET /api/admin/posts/{id}
export async function getPost(id: string): Promise<AdminPostSummary> {
  return (await apiRequest(`/api/admin/posts/${id}`, {
    headers: getAuthHeaders(),
  })) as AdminPostSummary
}

// PATCH /api/admin/posts/{id}
export async function updatePost(
  id: string,
  data: AdminUpdatePostRequest
): Promise<AdminPostSummary> {
  return (await apiRequest(`/api/admin/posts/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })) as AdminPostSummary
}

// DELETE /api/admin/posts/{id}
export async function deletePost(id: string): Promise<AdminDeletePostResponse> {
  return (await apiRequest(`/api/admin/posts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })) as AdminDeletePostResponse
}

// GET /api/admin/settings
export async function getSettings(): Promise<AdminServerSettings> {
  return (await apiRequest('/api/admin/settings', {
    headers: getAuthHeaders(),
  })) as AdminServerSettings
}

// PATCH /api/admin/settings
export async function updateSettings(
  data: UpdateSettingsRequest
): Promise<AdminServerSettings> {
  return (await apiRequest('/api/admin/settings', {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })) as AdminServerSettings
}

// GET /api/admin/invites
export async function listInvites(): Promise<InviteTokenRecord[]> {
  return (await apiRequest('/api/admin/invites', {
    headers: getAuthHeaders(),
  })) as InviteTokenRecord[]
}

// DELETE /api/admin/invites/{token}
export async function revokeInvite(
  token: string
): Promise<RevokeInviteTokenResponse> {
  return (await apiRequest(`/api/admin/invites/${token}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })) as RevokeInviteTokenResponse
}

