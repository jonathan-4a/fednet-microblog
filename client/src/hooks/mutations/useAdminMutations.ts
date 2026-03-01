// src/hooks/mutations/useAdminMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  updateUser,
  deleteUser,
  deletePost,
  updateSettings,
  revokeInvite,
} from '../../services/admin'
import type { UpdateUserRequest, UpdateSettingsRequest } from '../../types/admin'

export function useUpdateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ username, data }: { username: string; data: UpdateUserRequest }) =>
      updateUser(username, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (username: string) => deleteUser(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

export function useDeletePostMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (guid: string) => deletePost(guid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateSettingsRequest) => updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
    },
  })
}

export function useRevokeInviteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (token: string) => revokeInvite(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invites'] })
    },
  })
}


