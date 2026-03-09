// src/hooks/useProfileDataQuery.ts
import { useParams, useSearchParams, useLocation } from 'react-router-dom'
import { useProfileQuery } from './queries/useProfileQuery'
import { useFollowersQuery } from './queries/useFollowersQuery'
import { useFollowingQuery } from './queries/useFollowingQuery'
import { useMastodonAccountCountsQuery } from './queries/useMastodonAccountCountsQuery'
import { resolveUrl } from '../services/posts/utils'
import { useCurrentUserProfileQuery } from './queries/useCurrentUserProfileQuery'
import type { OrderedCollection, OrderedCollectionPage } from '../types/activitypub'
import { ACTIVITY_STREAMS_CONTEXT } from '../types/activitypub'
import { useAuthStore } from '../stores/authStore'

export function useProfileDataQuery() {
  const { username } = useParams<{ username?: string }>()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const remoteActorUrl = searchParams.get('url')
  const isRemoteRoute =
    location.pathname === '/profile/remote' || username === 'remote'
  const isRemote = isRemoteRoute && remoteActorUrl !== null

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useProfileQuery(
    isRemote ? undefined : username,
    isRemote ? remoteActorUrl : undefined
  )

  const baseId = profile?.id?.replace(/\/$/, '') ?? ''
  const followersUrl = profile?.followers
    ? (profile.id ? resolveUrl(profile.followers, profile.id) : profile.followers)
    : (baseId ? `${baseId}/followers` : undefined)
  const followingUrl = profile?.following
    ? (profile.id ? resolveUrl(profile.following, profile.id) : profile.following)
    : (baseId ? `${baseId}/following` : undefined)

  const followersQuery = useFollowersQuery(
    isRemote ? undefined : username,
    followersUrl
  )

  const followingQuery = useFollowingQuery(
    isRemote ? undefined : username,
    followingUrl
  )

  const { data: mastodonCounts } = useMastodonAccountCountsQuery(
    profile?.id,
    isRemote && !!profile?.id
  )

  const { data: currentUserProfile, refetch: refetchCurrentUserProfile } =
    useCurrentUserProfileQuery()

  const currentUser = useAuthStore((state) => state.user)

  const { data: currentUserActor } = useProfileQuery(
    currentUser?.username,
    undefined
  )
  
  const currentUserFollowingQuery = useFollowingQuery(
    currentUser?.username,
    currentUserActor?.following
  )

  const flattenCollection = (pages: (OrderedCollection | OrderedCollectionPage | (Record<string, unknown> & { _collectionPrivate?: boolean }) | null)[] | undefined): (OrderedCollection & { _collectionPrivate?: boolean }) | null => {
    if (!pages || pages.length === 0) return null
    
    const firstPage = pages[0]
    if (!firstPage) return null

    const isPrivate = pages.some((p) => p && typeof p === 'object' && '_collectionPrivate' in p && (p as { _collectionPrivate?: boolean })._collectionPrivate === true)

    const allItems: unknown[] = []
    let totalItems = 0
    const collectionId = firstPage.id

    if ('totalItems' in firstPage && typeof (firstPage as OrderedCollection).totalItems === 'number') {
      totalItems = (firstPage as OrderedCollection).totalItems || 0
    }

    for (const page of pages) {
      if (!page) continue
      if ('orderedItems' in page && page.orderedItems && Array.isArray(page.orderedItems)) {
        allItems.push(...page.orderedItems)
      }
    }

    if (totalItems === 0 && allItems.length > 0) {
      totalItems = allItems.length
    }

    const lastPage = pages[pages.length - 1]
    let nextPageUrl: string | undefined = undefined

    if (lastPage) {
      if ('next' in lastPage && typeof lastPage.next === 'string') {
        nextPageUrl = lastPage.next
      }
      else if ('first' in lastPage && typeof lastPage.first === 'object' && lastPage.first && 'next' in lastPage.first) {
        nextPageUrl = (lastPage.first as OrderedCollectionPage).next || undefined
      }
    }

    const result: OrderedCollection & { _collectionPrivate?: boolean } = {
      '@context': (firstPage['@context'] ?? ACTIVITY_STREAMS_CONTEXT) as string | string[],
      type: 'OrderedCollection',
      id: String(collectionId ?? ''),
      totalItems,
      orderedItems: allItems,
    }
    
    if (nextPageUrl) {
      (result as OrderedCollection & { next?: string }).next = nextPageUrl
    }

    if (isPrivate) {
      result._collectionPrivate = true
    }

    return result
  }

  const currentUserFollowing = flattenCollection(currentUserFollowingQuery.data?.pages)

  const isPrivateError = (err: unknown) => {
    if (!err || typeof err !== 'object' || !('status' in err)) return false
    const status = (err as { status?: number }).status
    return status === 401 || status === 403
  }
  const privatePlaceholder = (id: string): OrderedCollection & { _collectionPrivate: true } => ({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    id,
    totalItems: 0,
    orderedItems: [],
    _collectionPrivate: true,
  })

  const followersRaw =
    flattenCollection(followersQuery.data?.pages) ??
    (followersQuery.isError && isPrivateError(followersQuery.error)
      ? privatePlaceholder(followersUrl ?? '')
      : null)
  const followingRaw =
    flattenCollection(followingQuery.data?.pages) ??
    (followingQuery.isError && isPrivateError(followingQuery.error)
      ? privatePlaceholder(followingUrl ?? '')
      : null)

  // When list is private: still show count if we have one (e.g. Mastodon); when opened show "Private". When no count and private, show no number.
  const followers = followersRaw
    ? {
        ...followersRaw,
        totalItems: followersRaw._collectionPrivate
          ? (mastodonCounts?.followers_count ?? undefined)
          : (followersRaw.totalItems ?? mastodonCounts?.followers_count ?? 0),
      }
    : mastodonCounts
      ? ({
          '@context': ACTIVITY_STREAMS_CONTEXT,
          type: 'OrderedCollection',
          id: followersUrl ?? '',
          orderedItems: [],
          totalItems: mastodonCounts.followers_count,
        } as OrderedCollection)
      : null
  const following = followingRaw
    ? {
        ...followingRaw,
        totalItems: followingRaw._collectionPrivate
          ? (mastodonCounts?.following_count ?? undefined)
          : (followingRaw.totalItems ?? mastodonCounts?.following_count ?? 0),
      }
    : mastodonCounts
      ? ({
          '@context': ACTIVITY_STREAMS_CONTEXT,
          type: 'OrderedCollection',
          id: followingUrl ?? '',
          orderedItems: [],
          totalItems: mastodonCounts.following_count,
        } as OrderedCollection)
      : null

  return {
    profile: profile ?? null,
    profileLoading,
    profileError: profileError?.message ?? null,
    isProfilePrivate: Boolean(
      profileError &&
        typeof profileError === 'object' &&
        'status' in profileError &&
        [401, 403].includes((profileError as Error & { status?: number }).status as number)
    ),
    profileErrorStatus: profileError && typeof profileError === 'object' && 'status' in profileError
      ? (profileError as Error & { status?: number }).status
      : undefined,
    refetchProfile,
    followers,
    followersQuery,
    refetchFollowers: followersQuery.refetch,
    following,
    followingQuery,
    refetchFollowing: followingQuery.refetch,
    currentUserProfile: currentUserProfile ?? null,
    refetchCurrentUserProfile,
    currentUserFollowing,
    refetchCurrentUserFollowing: currentUserFollowingQuery.refetch,
    isRemote,
  }
}

