// src/hooks/queries/usePostRepliesDetailsQuery.ts
import { useInfiniteQuery } from '@tanstack/react-query'
import { getPostRepliesDetails, getPostRepliesPage } from '../../services/posts'
import { useAuthContext } from '../../hooks/useAuthContext'
import type { Post } from '../../types/posts'

export function usePostRepliesDetailsQuery(
  postUrl: string | null,
  params?: {
    limit?: number
  }
) {
  const { user: currentUser } = useAuthContext()

  return useInfiniteQuery<{ replies: Post[]; totalItems: number; next?: string | null }, Error>({
    queryKey: [
      'repliesDetails',
      postUrl,
      params?.limit,
      currentUser?.username,
    ],
    queryFn: async ({ pageParam }) => {
      if (!postUrl) {
        throw new Error('Post URL is required')
      }

      // First page: fetch initial replies
      if (!pageParam) {
        return await getPostRepliesDetails(postUrl, {
          limit: params?.limit || 20,
          currentUsername: currentUser?.username,
        })
      }

      // Subsequent pages: fetch the page URL directly
      return await getPostRepliesPage(pageParam as string, {
        currentUsername: currentUser?.username,
      })
    },
    getNextPageParam: (lastPage) => {
      return lastPage.next || undefined
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!postUrl,
    staleTime: 30000,
  })
}

