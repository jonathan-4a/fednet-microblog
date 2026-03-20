// src/hooks/queries/useHomeFeedQuery.ts
import { useInfiniteQuery } from '@tanstack/react-query'
import { loadHomeFeedForUser, type HomeFeedLoadOptions } from '../../services/feedService'
import type { FeedItem } from '../../services/feed'

interface HomeFeedPage {
  items: FeedItem[]
  hasMore: boolean
}

export function useHomeFeedQuery(
  username: string | undefined,
  options?: HomeFeedLoadOptions
) {
  const pageSize = (options as HomeFeedLoadOptions & { pageSize?: number })?.postsPerUserLimit ?? 20

  return useInfiniteQuery<HomeFeedPage, Error>({
    queryKey: ['homeFeed', username, { ...options, pageSize }],
    queryFn: async ({ pageParam = 0 }) => {
      if (!username) {
        return { items: [], hasMore: false }
      }
      const { feed } = await loadHomeFeedForUser(username, options)
      const start = (pageParam as number) * pageSize
      const end = start + pageSize
      const slice = feed.slice(start, end)
      return {
        items: slice,
        hasMore: end < feed.length,
      }
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length : undefined,
    enabled: !!username,
    staleTime: 30000,
    initialPageParam: 0,
  })
}

