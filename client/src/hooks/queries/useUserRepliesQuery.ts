import { useInfiniteQuery } from '@tanstack/react-query'
import { getUserReplies, getRepliesCollectionPage } from '../../services/posts'
import type { Post } from '../../types/posts'
import { useAuthContext } from '../useAuthContext'
import type { Actor } from '../../types/activitypub'

interface UseUserRepliesResult {
  posts: Post[]
  totalItems: number
  next?: string | null
}

export function useUserRepliesQuery(
  username: string | undefined,
  profile?: Actor | null
) {
  const { user: currentUser } = useAuthContext()

  return useInfiniteQuery<UseUserRepliesResult, Error>({
    queryKey: ['replies', username, profile?.outbox, currentUser?.username],
    queryFn: async ({ pageParam }) => {
      if (!username && !profile) {
        return { posts: [], totalItems: 0 }
      }

      const actorUsername =
        username ||
        profile?.preferredUsername ||
        profile?.id.split('/').pop() ||
        'unknown'

      if (!pageParam) {
        return await getUserReplies(actorUsername, {
          limit: 50,
          currentUsername: currentUser?.username,
          outboxUrl: profile?.outbox,
        })
      }

      return await getRepliesCollectionPage(
        pageParam as string,
        actorUsername,
        {
          currentUsername: currentUser?.username,
        }
      )
    },
    getNextPageParam: (lastPage) => lastPage.next || undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!(username || profile),
    staleTime: 30000,
  })
}

