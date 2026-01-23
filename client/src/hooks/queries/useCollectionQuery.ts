import { useInfiniteQuery } from '@tanstack/react-query'
import { getFollowers, getFollowing, getCollectionPage } from '../../services/socials'
import type { OrderedCollection, OrderedCollectionPage } from '../../types/activitypub'

type CollectionType = 'followers' | 'following'

export function useCollectionQuery(
  type: CollectionType,
  username: string | undefined,
  collectionUrl?: string
) {
  const fetcher = type === 'followers' ? getFollowers : getFollowing

  return useInfiniteQuery<OrderedCollection | OrderedCollectionPage | null, Error>({
    queryKey: [type, username, collectionUrl],
    queryFn: async ({ pageParam }) => {
      const url = (pageParam as string | undefined) || collectionUrl
      if (!url || typeof url !== 'string') return null

      // First page: fetch collection and follow 'first' if needed
      if (!pageParam) {
        return await fetcher(url)
      }
      
      // Subsequent pages: fetch the page directly
      return await getCollectionPage(url)
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined
      
      // Check if there's a next page
      // The API returns OrderedCollectionPage for paginated results
      // Check if it's a page (has 'next' property directly) or collection with next
      const page = lastPage as OrderedCollection & { next?: string }
      if (page.next) {
        return page.next
      }
      
      // Check if first page has next (only if lastPage is OrderedCollection)
      if ('first' in lastPage && typeof lastPage.first === 'object' && lastPage.first && 'next' in lastPage.first) {
        const firstPage = lastPage.first as OrderedCollectionPage
        return firstPage.next || undefined
      }
      
      return undefined
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!(username || collectionUrl),
    staleTime: 30000,
  })
}

