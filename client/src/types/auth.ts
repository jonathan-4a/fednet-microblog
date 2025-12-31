// Types for /api/auth/* endpoints - matches API DTOs exactly

// POST /api/auth/register - Request (matches RegisterUserInput)
export interface RegisterRequest {
  username: string
  password: string
  displayName?: string
  summary?: string
  inviteToken?: string
}

// POST /api/auth/register - Response (matches RegisterUserOutput)
export interface RegisterResponse {
  success: boolean
}

// POST /api/auth/login - Request (matches LoginUserInput, but client doesn't send domain/protocol)
export interface LoginRequest {
  username: string
  password: string
}

// POST /api/auth/login - Response (matches LoginUserOutput)
export interface LoginResponse {
  token: string
  user: AuthenticatedUserOutput
}

// User object in LoginResponse (matches AuthenticatedUserOutput exactly)
export interface AuthenticatedUserOutput {
  username: string
  displayName: string
  summary: string
  isActive: boolean
  isAdmin: boolean
  isFollowingPublic: boolean
  createdAt: number
}

// POST /api/auth/logout - Response
export interface LogoutResponse {
  msg: string
}

