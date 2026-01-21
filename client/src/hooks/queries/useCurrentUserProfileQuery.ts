import { useQuery } from '@tanstack/react-query'
import { getUserProfile } from '../../services/users'
import type { UserProfileOutput } from '../../types/user'

export function useCurrentUserProfileQuery() {
  return useQuery<UserProfileOutput, Error>({
    queryKey: ['currentUserProfile'],
    queryFn: getUserProfile,
    staleTime: 60000, // 1 minute
  })
}

