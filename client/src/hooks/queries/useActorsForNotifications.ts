// src/hooks/queries/useActorsForNotifications.ts
import { useQueries } from '@tanstack/react-query'
import { getActor } from '../../services/federation'

export interface ActorInfo {
  name: string
  preferredUsername: string
}

export function useActorsForNotifications(actorUrls: string[]): Map<string, ActorInfo> {
  const unique = [...new Set(actorUrls)].filter(Boolean)

  const results = useQueries({
    queries: unique.map((url) => ({
      queryKey: ['actor', url] as const,
      queryFn: async (): Promise<ActorInfo | null> => {
        try {
          const actor = await getActor(url)
          return {
            name: actor.name || actor.preferredUsername || 'Unknown',
            preferredUsername: actor.preferredUsername || 'unknown',
          }
        } catch {
          return null
        }
      },
      enabled: !!url,
      staleTime: 60000,
    })),
  })

  const map = new Map<string, ActorInfo>()
  unique.forEach((url, i) => {
    const data = results[i]?.data
    if (data) map.set(url, data)
  })
  return map
}
