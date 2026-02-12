import { Box, CircularProgress } from '@mui/material'
import { useInView } from 'react-intersection-observer'
import { useEffect } from 'react'
import { ReplyWithParentCard } from '../post/ReplyWithParentCard'
import { useUserPostsQuery } from '../../hooks/queries/useUserPostsQuery'
import { LoadingSpinner } from '../LoadingSpinner'
import { ErrorDisplay } from '../ErrorDisplay'
import { EmptyState } from '../EmptyState'
import type { Post } from '../../types/posts'
import type { Actor } from '../../types/activitypub'

export interface RepliesTabProps {
  username?: string
  profile: Actor
  onReply: (post: Post) => void
  onRepost: (post: Post) => void
  onLike: (post: Post) => void
  onEdit?: (post: Post) => void
  onDelete?: (post: Post) => void
}

export function RepliesTab({
  username,
  profile,
  onReply,
  onRepost,
  onLike,
  onEdit,
  onDelete,
}: RepliesTabProps) {
  // Same outbox query as Posts/Reposts – replies are derived from cached pages (no refetch)
  const {
    data: outboxData,
    isLoading: loading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useUserPostsQuery(username, profile)

  const replies = outboxData?.pages.flatMap((p) => p.replies ?? []) ?? []

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorDisplay message={error.message} />
  }

  if (replies.length === 0) {
    return <EmptyState message="No replies yet" />
  }

  return (
    <Box>
      {replies.map((reply) => (
        <ReplyWithParentCard
          key={reply.noteId || reply.guid}
          reply={reply}
          authorDisplayName={profile?.name || profile?.preferredUsername}
          authorUsername={username || ''}
          onReply={onReply}
          onRepost={onRepost}
          onLike={onLike}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      {hasNextPage && (
        <Box
          ref={loadMoreRef}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            py: 2,
          }}
        >
          {isFetchingNextPage && <CircularProgress size={24} />}
        </Box>
      )}
    </Box>
  )
}

