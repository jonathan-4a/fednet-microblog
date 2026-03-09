// src/hooks/queries/useMastodonAccountCountsQuery.ts
import { useQuery } from '@tanstack/react-query'
import { getMastodonAccountByActorUrl } from '../../services/mastodonProfile'

/** Fetch followers/following/statuses counts via Mastodon API for remote profiles when ActivityPub lacks them */
export function useMastodonAccountCountsQuery(actorUrl: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['mastodonAccountCounts', actorUrl],
    queryFn: async () => getMastodonAccountByActorUrl(actorUrl!),
    enabled: !!enabled && !!actorUrl,
    staleTime: 60000,
  })
}
