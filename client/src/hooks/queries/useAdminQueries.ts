import { useQuery } from '@tanstack/react-query'
import {
  getDashboard,
  listUsers,
  listPosts,
  getSettings,
  listInvites,
} from '../../services/admin'
import type {
  DashboardResponse,
  AdminUsersListResponse,
  AdminPostsListResponse,
  AdminServerSettings,
  InviteTokenRecord,
} from '../../types/admin'

export function useDashboardQuery() {
  return useQuery<DashboardResponse, Error>({
    queryKey: ['admin', 'dashboard'],
    queryFn: getDashboard,
    staleTime: 30000,
  })
}

export function useAdminUsersQuery(params?: {
  page?: number
  limit?: number
  search?: string
  status?: 'all' | 'active' | 'inactive'
  sort?: string
  order?: 'asc' | 'desc'
}) {
  return useQuery<AdminUsersListResponse, Error>({
    queryKey: ['admin', 'users', params],
    queryFn: () => listUsers(params),
    staleTime: 30000,
  })
}

export function useAdminPostsQuery(params?: {
  page?: number
  limit?: number
  authorUsername?: string
}) {
  return useQuery<AdminPostsListResponse, Error>({
    queryKey: ['admin', 'posts', params],
    queryFn: () => listPosts(params),
    staleTime: 30000,
  })
}

export function useAdminSettingsQuery() {
  return useQuery<AdminServerSettings, Error>({
    queryKey: ['admin', 'settings'],
    queryFn: getSettings,
    staleTime: 60000,
  })
}

export function useAdminInvitesQuery() {
  return useQuery<InviteTokenRecord[], Error>({
    queryKey: ['admin', 'invites'],
    queryFn: listInvites,
    staleTime: 30000,
  })
}

