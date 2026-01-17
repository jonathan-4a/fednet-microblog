import { useParams, useSearchParams, useLocation } from 'react-router-dom'
import { useProfileQuery } from './queries/useProfileQuery'
import { useFollowersQuery } from './queries/useFollowersQuery'
import { useFollowingQuery } from './queries/useFollowingQuery'
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

  // Use profile URLs if available, otherwise build from username
  // Unified fetcher handles local/remote automatically
  const followersQuery = useFollowersQuery(
    isRemote ? undefined : username,
    profile?.followers
  )

  const followingQuery = useFollowingQuery(
    isRemote ? undefined : username,
    profile?.following
  )

  const { data: currentUserProfile, refetch: refetchCurrentUserProfile } =
    useCurrentUserProfileQuery()

  const currentUser = useAuthStore((state) => state.user)

  // Get current user's Actor profile to get their following URL
  const { data: currentUserActor } = useProfileQuery(
    currentUser?.username,
    undefined
  )
  
  const currentUserFollowingQuery = useFollowingQuery(
    currentUser?.username,
    currentUserActor?.following
  )

  // Flatten infinite query pages into a single collection
  const flattenCollection = (pages: (OrderedCollection | OrderedCollectionPage | (Record<string, unknown> & { _collectionPrivate?: boolean }) | null)[] | undefined): (OrderedCollection & { _collectionPrivate?: boolean }) | null => {
    if (!pages || pages.length === 0) return null
    
    // Get the first page to get collection metadata
    const firstPage = pages[0]
    if (!firstPage) return null

    // Check if collection is private (403 from server)
    const isPrivate = pages.some((p) => p && typeof p === 'object' && '_collectionPrivate' in p && (p as { _collectionPrivate?: boolean })._collectionPrivate === true)

    // Collect all orderedItems from all pages
    const allItems: unknown[] = []
    let totalItems = 0
    const collectionId = firstPage.id

    // If first page is OrderedCollection, get totalItems from it
    if ('totalItems' in firstPage && typeof (firstPage as OrderedCollection).totalItems === 'number') {
      totalItems = (firstPage as OrderedCollection).totalItems || 0
    }

    for (const page of pages) {
      if (!page) continue
      if ('orderedItems' in page && page.orderedItems && Array.isArray(page.orderedItems)) {
        allItems.push(...page.orderedItems)
      }
    }

    // If totalItems was missing (e.g. server returned only a page), use loaded count so the tab count is correct
    if (totalItems === 0 && allItems.length > 0) {
      totalItems = allItems.length
    }

    const lastPage = pages[pages.length - 1]
    let nextPageUrl: string | undefined = undefined
    
    if (lastPage) {
      // Check if lastPage has 'next' property (OrderedCollectionPage)
      if ('next' in lastPage && typeof lastPage.next === 'string') {
        nextPageUrl = lastPage.next
      }
      // Or check if it's an OrderedCollection with first page that has next
      else if ('first' in lastPage && typeof lastPage.first === 'object' && lastPage.first && 'next' in lastPage.first) {
        nextPageUrl = (lastPage.first as OrderedCollectionPage).next || undefined
      }
    }

    // Build the result as OrderedCollection
    const result: OrderedCollection & { _collectionPrivate?: boolean } = {
      '@context': (firstPage['@context'] ?? ACTIVITY_STREAMS_CONTEXT) as string | string[],
      type: 'OrderedCollection',
      id: String(collectionId ?? ''),
      totalItems,
      orderedItems: allItems,
    }
    
    // Add next as a custom property for pagination
    if (nextPageUrl) {
      (result as OrderedCollection & { next?: string }).next = nextPageUrl
    }

    if (isPrivate) {
      result._collectionPrivate = true
    }

    return result
  }

  const currentUserFollowing = flattenCollection(currentUserFollowingQuery.data?.pages)

  // When the list fetch returns 403 (forbidden), show "Private" even if we have no data
  const is403 = (err: unknown) =>
    err && typeof err === 'object' && 'status' in err && (err as { status?: number }).status === 403
  const privatePlaceholder = (id: string): OrderedCollection & { _collectionPrivate: true } => ({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    id,
    totalItems: 0,
    orderedItems: [],
    _collectionPrivate: true,
  })

  const followers =
    flattenCollection(followersQuery.data?.pages) ??
    (followersQuery.isError && is403(followersQuery.error)
      ? privatePlaceholder(profile?.followers ?? '')
      : null)
  const following =
    flattenCollection(followingQuery.data?.pages) ??
    (followingQuery.isError && is403(followingQuery.error)
      ? privatePlaceholder(profile?.following ?? '')
      : null)

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

