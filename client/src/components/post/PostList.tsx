// src/components/post/PostList.tsx
import { Box, CircularProgress, Typography } from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import { useInView } from 'react-intersection-observer'
import { useEffect } from 'react'
import { PostCard } from './PostCard'
import { LoadingSpinner } from '../LoadingSpinner'
import { ErrorDisplay } from '../ErrorDisplay'
import { EmptyState } from '../EmptyState'
import type { Post } from '../../types/posts'

interface PostListProps {
  posts: Post[]
  loading: boolean
  error: string | null
  authorDisplayName?: string
  authorUsername?: string
  onReply?: (post: Post) => void
  onRepost?: (post: Post) => void
  onLike?: (post: Post) => void
  onEdit?: (post: Post) => void
  onDelete?: (post: Post) => void
  hasNextPage?: boolean
  fetchNextPage?: () => void
  isFetchingNextPage?: boolean
  /** When true, show "This information is private." with lock icon instead of "No posts yet" */
  isPrivate?: boolean
  privateMessage?: string
  /** Override empty state message (default: "No posts yet") */
  emptyMessage?: string
  /** When true, show "Replied to [original]" on each post that has inReplyTo (e.g. Profile Replies tab) */
  showRepliedToContext?: boolean
}

export function PostList({
  posts,
  loading,
  error,
  authorDisplayName,
  authorUsername,
  onReply,
  onRepost,
  onLike,
  onEdit,
  onDelete,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  isPrivate,
  privateMessage = 'This information is private.',
  emptyMessage = 'No posts yet',
  showRepliedToContext = false,
}: PostListProps) {
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

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorDisplay message={error} />
  }

  if (isPrivate) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <LockIcon sx={{ fontSize: 40, color: 'text.secondary' }} aria-hidden />
        <Typography color='text.secondary'>{privateMessage}</Typography>
      </Box>
    )
  }

  if (posts.length === 0) {
    return <EmptyState message={emptyMessage} />
  }

  return (
    <Box>
      {posts.map((post) => (
        <PostCard
          key={post.guid}
          post={post}
          authorDisplayName={authorDisplayName}
          authorUsername={authorUsername}
          onReply={onReply}
          onRepost={onRepost}
          onLike={onLike}
          onEdit={onEdit}
          onDelete={onDelete}
          showRepliedToContext={showRepliedToContext}
        />
      ))}
      {/* Infinite scroll trigger */}
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


