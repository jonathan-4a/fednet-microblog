// src/hooks/mutations/useEditProfileMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProfile } from '../../services/users'
import type { UpdateProfileRequest } from '../../types/user'

export function useEditProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateProfile(data),
    onSuccess: () => {
      // Invalidate profile queries to refetch
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] })
    },
  })
}


