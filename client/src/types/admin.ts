// Types for /api/admin/* endpoints

// GET /api/admin/dashboard - Response
export interface DashboardResponse {
  stats: DashboardStats
  recent_activity: {
    users: AdminUserSummary[]
  }
}

export interface DashboardStats {
  total_users: number
  active_users: number
  inactive_users: number
  total_posts: number
}

export interface AdminUserSummary {
  username: string
  address: string
  display_name: string | null
  created_at: string
  is_active: boolean
}

// GET /api/admin/users - Request (query parameters)
export interface ListUsersRequest {
  page?: number
  limit?: number
  search?: string
  status?: 'all' | 'active' | 'inactive'
  sort?: string
  order?: 'asc' | 'desc'
}

// GET /api/admin/users - Response
export interface AdminUsersListResponse {
  users: AdminUserListItem[]
  pagination: Pagination
}

export interface AdminUserListItem {
  username: string
  address: string
  display_name: string | null
  summary: string | null
  created_at: string
  is_active: boolean
  is_admin: boolean
  is_following_public: boolean
  post_count: number
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

// GET /api/admin/users/{id} - Response
export interface AdminUserResponse {
  user: AdminUserListItem
  posts: AdminPostSummary[]
}

// PATCH /api/admin/users/{id} - Request
export interface UpdateUserRequest {
  is_active: boolean
}

// PATCH /api/admin/users/{id} - Response
export interface AdminUserStatusResponse {
  msg: string
  is_active: boolean
}

// DELETE /api/admin/users/{id} - Response
export interface DeleteUserResponse {
  msg: string
}

// GET /api/admin/posts - Request (query parameters)
export interface ListPostsRequest {
  page?: number
  limit?: number
  authorUsername?: string
}

// GET /api/admin/posts - Response
export interface AdminPostsListResponse {
  posts: AdminPostSummary[]
  pagination: Pagination
}

export interface AdminPostSummary {
  guid: string
  author_username: string
  content: string
  created_at: string
  raw_message: object | null
}

// PATCH /api/admin/posts/{id} - Request
export interface UpdatePostRequest {
  content?: string
  message?: string
  is_deleted?: boolean
}

// PATCH /api/admin/posts/{id} - Response
export interface UpdatePostResponse {
  updated: boolean
}

// DELETE /api/admin/posts/{id} - Response
export interface DeletePostResponse {
  msg: string
}

// GET /api/admin/settings - Response
// PATCH /api/admin/settings - Response
export interface AdminServerSettings {
  registration_mode: 'open' | 'invite'
  allow_public_peers: boolean
  auto_fetch_peer_links: boolean
}

// PATCH /api/admin/settings - Request
export interface UpdateSettingsRequest {
  registration_mode?: 'open' | 'invite'
  allow_public_peers?: boolean
  auto_fetch_peer_links?: boolean
}

// GET /api/admin/invites - Response (array)
export interface InviteTokenRecord {
  token: string
  created_by: string | null
  status: 'unused' | 'used' | 'revoked'
  created_at: number
  used_at: number | null
  used_by: string | null
}

// DELETE /api/admin/invites/{token} - Response
export interface RevokeInviteTokenResponse {
  success: boolean
  message: string
}

