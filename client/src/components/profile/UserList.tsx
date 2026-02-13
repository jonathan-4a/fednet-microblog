import { List, Box, CircularProgress, Typography } from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import { useState, lazy, Suspense, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { useUserListFollow } from '../../hooks/useUserListFollow'
import { DialogLoadingFallback } from '../LoadingFallback'
import { UserListItem } from './UserListItem'
import type { OrderedCollection, Actor } from '../../types/activitypub'

const UnfollowDialog = lazy(() =>
  import('../UnfollowDialog').then((module) => ({
    default: module.UnfollowDialog,
  }))
)

interface UserListProps {
  users: OrderedCollection | (OrderedCollection & { _collectionPrivate?: boolean }) | null
  currentUser: { username: string | null } | null
  currentUserFollowing: OrderedCollection | null | undefined
  refetchCurrentUserFollowing: () => Promise<void>
  emptyMessage?: string
  privateMessage?: string
  onError?: (message: string) => void
  // For infinite scroll pagination
  hasNextPage?: boolean
  fetchNextPage?: () => void
  isFetchingNextPage?: boolean
}

export function UserList({
  users,
  currentUser,
  currentUserFollowing,
  refetchCurrentUserFollowing,
  emptyMessage = 'No users found',
  privateMessage = 'This information is private.',
  onError,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
}: UserListProps) {
  const [unfollowTarget, setUnfollowTarget] = useState<{
    id: string
    username: string
  } | null>(null)

  // Infinite scroll trigger
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  // Load more when scroll reaches the trigger
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const {
    handleUserFollow,
    performUnfollow,
    isUserFollowing,
    userFollowLoading,
  } = useUserListFollow({
    currentUsername: currentUser?.username ?? undefined,
    currentUserFollowing,
    refetchCurrentUserFollowing,
    onError,
  })

  const isPrivate = users && '_collectionPrivate' in users && users._collectionPrivate === true

  if (isPrivate) {
    return (
      <Box sx={{ p: 10, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <LockIcon sx={{ fontSize: 30, color: 'lightgray' }} aria-hidden />
        <Typography color='text.secondary'>{privateMessage}</Typography>
      </Box>
    )
  }

  if (!users || !users.orderedItems || users.orderedItems.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color='text.secondary'>{emptyMessage}</Typography>
      </Box>
    )
  }

  const getUserDetails = (item: unknown) => {
    if (typeof item === 'string') {
      const username = item.split('/').pop() || item
      return {
        id: item,
        preferredUsername: username,
        name: username,
        summary: '',
        icon: undefined,
      }
    }
    const actor = item as Partial<Actor> & {
      id: string
      preferredUsername: string
    }
    return {
      id: actor.id,
      preferredUsername: actor.preferredUsername,
      name: actor.name,
      summary: actor.summary,
      icon:
        'icon' in actor &&
        actor.icon &&
        typeof actor.icon === 'object' &&
        'url' in actor.icon
          ? (actor.icon as { url: string })
          : undefined,
    }
  }

  return (
    <>
      <List>
        {users.orderedItems.map((item: unknown) => {
          const user = getUserDetails(item)
          const isMe = currentUser?.username === user.preferredUsername

          return (
            <UserListItem
              key={user.id}
              user={user}
              isMe={isMe}
              isFollowing={isUserFollowing(user.id)}
              isLoading={!!userFollowLoading[user.id]}
              showFollow={!!currentUser}
              onFollow={handleUserFollow}
              onUnfollowRequest={(user) =>
                setUnfollowTarget({ id: user.id, username: user.username })
              }
              width={85}
              height={35}
            />
          )
        })}
      </List>

      {/* Infinite scroll trigger and loading indicator */}
      {hasNextPage && (
        <Box
          ref={loadMoreRef}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 2,
          }}
        >
          {isFetchingNextPage && <CircularProgress size={24} />}
        </Box>
      )}

      {unfollowTarget && (
        <Suspense fallback={<DialogLoadingFallback />}>
          <UnfollowDialog
            open={!!unfollowTarget}
            onClose={() => setUnfollowTarget(null)}
            onConfirm={async () => {
              if (unfollowTarget) {
                await performUnfollow(unfollowTarget.id)
                setUnfollowTarget(null)
              }
            }}
            username={unfollowTarget.username}
            loading={
              unfollowTarget ? userFollowLoading[unfollowTarget.id] : false
            }
          />
        </Suspense>
      )}
    </>
  )
}

