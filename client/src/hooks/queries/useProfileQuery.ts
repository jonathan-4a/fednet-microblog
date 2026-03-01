// src/hooks/queries/useProfileQuery.ts
import { useQuery } from '@tanstack/react-query'
import { getActor } from '../../services/federation'
import { getWebFinger } from '../../services/webfinger'
import { API_BASE } from '../../config'
import type { Actor } from '../../types/activitypub'

export function useProfileQuery(
  username: string | undefined,
  actorUrl?: string
) {
  return useQuery<Actor | null, Error>({
    queryKey: ['profile', username, actorUrl],
    queryFn: async () => {
      let targetUrl: string | null = null

      if (actorUrl) {
        // Check if it's a handle (acct:user@domain or user@domain)
        if (
          actorUrl.startsWith('acct:') ||
          (actorUrl.includes('@') && !actorUrl.startsWith('http'))
        ) {
          const resolved = await getWebFinger(actorUrl)
          if (!resolved) {
            throw new Error(`Could not resolve handle: ${actorUrl}`)
          }
          targetUrl = resolved
        } else {
          targetUrl = actorUrl
        }
      } else if (username) {
        // For local users, build actor URL from username
        targetUrl = `${API_BASE}/u/${username}`
      }

      if (!targetUrl) {
        return null
      }

      // Unified fetcher automatically handles local/remote
      return await getActor(targetUrl)
    },
    enabled: !!(username || actorUrl),
    staleTime: 60000, // 1 minute
  })
}

