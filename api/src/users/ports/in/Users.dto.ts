// src/users/ports/in/Users.dto.ts
export interface CreateUserInput {
  username: string;
  displayName: string;
  summary: string;
  isActive: boolean;
  isAdmin: boolean;
  isFollowingPublic: boolean;
  createdAt: number;
}

export interface UpdateUserFlagsInput {
  username: string;
  isAdmin?: boolean;
  isActive?: boolean;
  isFollowingPublic?: boolean;
}
export interface UpdateProfileInput {
  displayName?: string;
  summary?: string;
  isFollowingPublic?: boolean;
}

export interface UpdateUserProfileInput {
  username: string;
  displayName?: string;
  summary?: string;
  isFollowingPublic?: boolean;
}

export interface SearchUsersInput {
  query: string;
  limit?: number;
  excludeUsername?: string;
}

export interface DeleteUserAccountInput {
  username: string;
}

export interface AuthenticatedUserOutput {
  username: string;
  displayName: string;
  summary: string;
  isActive: boolean;
  isAdmin: boolean;
  isFollowingPublic: boolean;
  createdAt: number;
}

export interface UserProfileOutput {
  username: string;
  displayName: string;
  summary: string;
  isFollowingPublic: boolean;
  createdAt: number;
}

export interface SearchUsersOutput {
  users: UserProfileOutput[];
}

export interface SearchUserOutput {
  username: string;
  displayName: string | null;
  summary: string | null;
  isActive: boolean;
}
