import { useQuery } from '@tanstack/react-query'
import { getPostDetails } from '../../services/posts'
import { useAuthContext } from '../../hooks/useAuthContext'
import type { Post } from '../../types/posts'

export function usePostQuery(postUrl: string | null) {
  const { user: currentUser } = useAuthContext()

  return useQuery<Post | null, Error>({
    queryKey: ['post', postUrl, currentUser?.username],
    queryFn: async () => {
      if (!postUrl) {
        throw new Error('Post URL is required')
      }

      return await getPostDetails(postUrl, {
        currentUsername: currentUser?.username,
      })
    },
    enabled: !!postUrl,
    staleTime: 30000,
  })
}

