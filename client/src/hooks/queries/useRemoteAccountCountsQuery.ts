import { useQuery } from '@tanstack/react-query'
import { getRemoteAccountCountsByActorUrl } from '../../services/remoteProfile'

export function useRemoteAccountCountsQuery(actorUrl: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['remoteAccountCounts', actorUrl],
    queryFn: async () => getRemoteAccountCountsByActorUrl(actorUrl!),
    enabled: !!enabled && !!actorUrl,
    staleTime: 60000,
  })
}
