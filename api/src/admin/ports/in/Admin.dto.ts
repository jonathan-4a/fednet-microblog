// src/admin/ports/in/Admin.dto.ts

export interface AdminStatsOutput {
  total_users: number;
  active_users: number;
  inactive_users: number;
  total_posts: number;
}

export interface AdminUserSummary {
  username: string;
  address: string;
  display_name: string | null;
  summary: string | null;
  created_at: string;
  is_active: boolean;
  is_admin: boolean;
  is_following_public: boolean;
  post_count: number;
}

export interface AdminPaginatedUsers {
  users: AdminUserSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AdminRecentUserOutput {
  username: string;
  address: string;
  display_name: string | null;
  created_at: string;
  is_active: boolean;
}

export interface AdminDashboardOutput {
  stats: AdminStatsOutput;
  recent_activity: {
    users: AdminRecentUserOutput[];
  };
}

export interface AdminUserOutput {
  username: string;
  address: string;
  display_name: string | null;
  summary: string | null;
  is_active: boolean;
  is_admin: boolean;
  is_following_public: boolean;
  post_count: number;
  created_at: string;
}

export interface AdminPostSummaryOutput {
  guid: string;
  author_username: string;
  content: string;
  created_at: string;
  raw_message?: Record<string, unknown>;
}

export interface AdminServerSettingsOutput {
  registration_mode: "open" | "invite";
  allow_public_peers: boolean;
  auto_fetch_peer_links: boolean;
}
export interface EnsureAdminUserInput {
  username: string;
  password: string;
  displayName?: string;
  summary?: string;
}

export interface AdminPostSummary {
  guid: string;
  author_username: string;
  content: string;
  created_at: string;
  raw_message?: Record<string, unknown>;
}

export interface AdminPaginatedPosts {
  posts: AdminPostSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AdminUserDetails {
  user: AdminUserSummary;
  posts: AdminPostSummary[];
}

export interface RevokeInviteTokenInput {
  token: string;
}

export interface RevokeInviteTokenOutput {
  success: boolean;
  message: string;
}

export interface UpdateAdminPostInput {
  guid: string;
  content?: string;
  is_deleted?: boolean;
}

export interface UpdateSettingsInput {
  registration_mode?: "open" | "invite";
  allow_public_peers?: boolean;
  auto_fetch_peer_links?: boolean;
}

