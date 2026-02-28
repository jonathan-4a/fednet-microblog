export interface UserProfileOutput {
  username: string
  displayName: string
  summary: string
  isFollowingPublic: boolean
  createdAt: number
  isActive?: boolean
  isAdmin?: boolean | number
}

export interface UpdateProfileRequest {
  displayName?: string
  summary?: string
  isFollowingPublic?: boolean
}

export interface SearchUsersResponse {
  users: UserProfileOutput[]
}

export interface InviteTokenResponse {
  token: string
  created_at: number
}


