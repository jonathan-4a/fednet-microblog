// src/hooks/queries/usePostRepliesQuery.ts
import { useQuery } from '@tanstack/react-query'
import { getPostReplies } from '../../services/posts'
import type { OrderedCollection } from '../../types/activitypub'

export function usePostRepliesQuery(
  username: string | undefined,
  guid: string | undefined,
  params?: {
    page?: number
    limit?: number
  }
) {
  return useQuery<OrderedCollection, Error>({
    queryKey: ['replies', username, guid, params?.page, params?.limit],
    queryFn: async () => {
      if (!username || !guid) {
        throw new Error('Username and GUID are required')
      }
      // Build noteIdUrl from username/guid for local posts
      const noteIdUrl = `/u/${username}/statuses/${guid}`
      return await getPostReplies(noteIdUrl, params)
    },
    enabled: !!username && !!guid,
    staleTime: 30000,
  })
}

