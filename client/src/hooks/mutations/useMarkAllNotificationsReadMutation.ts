// src/hooks/mutations/useMarkAllNotificationsReadMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markAllNotificationsRead } from '../../services/notifications'

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
