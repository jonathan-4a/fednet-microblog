// src/admin/ports/out/IAdminUserRepository.ts

export interface AdminUserRecord {
  username: string;
  display_name: string | null;
  summary: string | null;
  is_active: 0 | 1;
  is_admin: 0 | 1;
  is_following_public: 0 | 1;
  created_at: number;
}

export interface UserListFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: "all" | "active" | "inactive";
  sortBy?: "username" | "display_name" | "created_at" | "is_active";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedUsers {
  users: AdminUserRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface IAdminUserRepository {
  countAll(): Promise<number>;
  countActive(): Promise<number>;
  findRecent(limit: number): Promise<AdminUserRecord[]>;
  findWithFilters(filters: UserListFilters): Promise<PaginatedUsers>;
  findByUsername(username: string): Promise<AdminUserRecord | undefined>;
  updateUserStatus(username: string, isActive: 0 | 1): Promise<void>;
  deleteUser(username: string): Promise<number>;
}

