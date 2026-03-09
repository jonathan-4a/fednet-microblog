// src/hooks/queries/useUserPostsQuery.ts
import { useInfiniteQuery } from '@tanstack/react-query'
import { getUserPosts, getPostCollectionPage } from '../../services/posts'
import type { Post } from '../../types/posts'
import { useAuthContext } from '../useAuthContext'
import type { Actor } from '../../types/activitypub'
import { API_BASE } from '../../config'
import { resolveUrl } from '../../services/posts/utils'

interface UseUserPostsResult {
  posts: Post[]
  replies: Post[]
  totalItems?: number
  next?: string | null
  private?: boolean
}

export function useUserPostsQuery(
  username: string | undefined,
  profile?: Actor | null
) {
  const { user: currentUser } = useAuthContext()

  return useInfiniteQuery<UseUserPostsResult, Error>({
    queryKey: ['posts', username, profile?.outbox, currentUser?.username],
    queryFn: async ({ pageParam }) => {
      if (!username && !profile) {
        return { posts: [], replies: [] }
      }

      // Extract username from profile if not provided
      // For remote users, use preferredUsername or extract from actor URL
      let actorUsername: string
      if (username) {
        actorUsername = username
      } else if (profile?.preferredUsername) {
        // For remote users, preferredUsername might be just the username part
        // We need to check if it's a full handle (user@domain) or just username
        if (profile.preferredUsername.includes('@')) {
          actorUsername = profile.preferredUsername
        } else if (profile.id) {
          // Extract domain from actor URL and construct full handle
          try {
            const actorUrl = new URL(profile.id)
            actorUsername = `${profile.preferredUsername}@${actorUrl.hostname}`
          } catch {
            actorUsername = profile.preferredUsername
          }
        } else {
          actorUsername = profile.preferredUsername
        }
      } else if (profile?.id) {
        // Fallback: extract from actor URL
        const parts = profile.id.split('/')
        const uIndex = parts.indexOf('u')
        if (uIndex !== -1 && uIndex < parts.length - 1) {
          actorUsername = parts[uIndex + 1]
        } else {
          actorUsername = parts[parts.length - 1] || 'unknown'
        }
      } else {
        actorUsername = 'unknown'
      }

      // Resolve relative outbox URLs (e.g. /users/bl00d/outbox) against actor id
      let outboxUrl = profile?.outbox || `${API_BASE}/u/${actorUsername}/outbox`
      if (outboxUrl && profile?.id && (outboxUrl.startsWith('/') || !outboxUrl.startsWith('http'))) {
        outboxUrl = resolveUrl(outboxUrl, profile.id)
      }

      // First page: fetch collection and parse posts
      // Don't pass page parameter - let the server return the base collection
      // Remote servers (Mastodon) will return first as a URL to fetch
      // Local servers will return first as an embedded object
      if (!pageParam) {
        return await getUserPosts(actorUsername, {
          limit: 20,
          currentUsername: currentUser?.username,
          outboxUrl,
        })
      }

      // Subsequent pages: same outbox, replies included so Replies tab uses cache
      return await getPostCollectionPage(
        pageParam as string,
        actorUsername,
        {
          currentUsername: currentUser?.username,
          outboxUrl,
        }
      )
    },
    getNextPageParam: (lastPage) => {
      return lastPage.next || undefined
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!(username || profile),
    staleTime: 30000,
  })
}

