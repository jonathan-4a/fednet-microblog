import { PostList } from '../post/PostList'
import { useUserPostsQuery } from '../../hooks/queries/useUserPostsQuery'
import { useUpdatePostMutation } from '../../hooks/mutations/useUpdatePostMutation'
import { useDeletePostMutation } from '../../hooks/mutations/useDeletePostMutation'
import { useSnackbar } from '../../hooks/useSnackbar'
import type { Post } from '../../types/posts'
import type { Actor } from '../../types/activitypub'

export interface PostsTabProps {
  username?: string
  profile: Actor
  onReply: (post: Post) => void
  onRepost: (post: Post) => void
  onLike: (post: Post) => void
  onEdit?: (post: Post) => void
  onDelete?: (post: Post) => void
}

export function PostsTab({
  username,
  profile,
  onReply,
  onRepost,
  onLike,
  onEdit,
  onDelete,
}: PostsTabProps) {
  const { showError } = useSnackbar()

  const {
    data: postsData,
    isLoading: loading,
    error,
    refetch: refetchPosts,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useUserPostsQuery(username, profile)

  // Flatten all pages into a single posts array — show only original posts (exclude replies and reposts)
  const allPosts = postsData?.pages.flatMap((page) => page.posts) ?? []
  const posts = allPosts.filter((p) => !p.isRepost)
  const postsPrivate = postsData?.pages?.[0]?.private === true

  useUpdatePostMutation({
    onSuccess: () => {
      refetchPosts()
    },
    onError: (err) => {
      showError(err.message || 'Failed to update post')
    },
  })

  useDeletePostMutation({
    onSuccess: () => {
      refetchPosts()
    },
    onError: (err) => {
      showError(err.message || 'Failed to delete post')
    },
  })

  return (
    <PostList
      posts={posts}
      loading={loading}
      error={error?.message ?? null}
      authorDisplayName={profile?.name || profile?.preferredUsername}
      authorUsername={username || ''}
      onReply={onReply}
      onRepost={onRepost}
      onLike={onLike}
      onEdit={onEdit}
      onDelete={onDelete}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isPrivate={postsPrivate}
    />
  )
}

