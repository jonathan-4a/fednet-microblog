// src/hooks/queries/useNotificationsQuery.ts
import { useQuery } from '@tanstack/react-query'
import { getNotifications } from '../../services/notifications'

export function useNotificationsQuery(
  params?: { limit?: number; offset?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['notifications', params?.limit, params?.offset],
    queryFn: () => getNotifications(params),
    staleTime: 30 * 1000,
    enabled: options?.enabled !== false,
  })
}
