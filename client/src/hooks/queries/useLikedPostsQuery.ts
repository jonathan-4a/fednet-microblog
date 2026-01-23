import { useQuery } from '@tanstack/react-query'
import { getLikedPostsForUser } from '../../services/posts'
import type { Post } from '../../types/posts'
import { useAuthContext } from '../useAuthContext'
import type { Actor } from '../../types/activitypub'
import { API_BASE } from '../../config'

interface UseLikedPostsResult {
  posts: Post[]
  totalItems: number
}

export function useLikedPostsQuery(
  username: string | undefined,
  profile?: Actor | null
) {
  const { user: currentUser } = useAuthContext()

  return useQuery<UseLikedPostsResult, Error>({
    queryKey: ['likedPosts', profile?.liked, currentUser?.username],
    queryFn: async () => {
      if (!username && !profile?.liked) {
        return { posts: [], totalItems: 0 }
      }

      // Use liked URL from profile if available, otherwise build from username (local only)
      const likedUrl =
        profile?.liked || (username ? `${API_BASE}/u/${username}/liked` : '')

      if (!likedUrl) {
        return { posts: [], totalItems: 0 }
      }

      return await getLikedPostsForUser(likedUrl, {
        currentUsername: currentUser?.username,
      })
    },
    enabled: !!(username || profile?.liked),
    staleTime: 30000,
  })
}

