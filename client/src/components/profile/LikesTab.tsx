// src/components/profile/LikesTab.tsx
import { PostList } from '../post/PostList'
import { useLikedPostsQuery } from '../../hooks/queries/useLikedPostsQuery'
import type { Post } from '../../types/posts'
import type { Actor } from '../../types/activitypub'

export interface LikesTabProps {
  profile: Actor
  username?: string
  onReply: (post: Post) => void
  onRepost: (post: Post) => void
  onLike: (post: Post) => void
  onEdit?: (post: Post) => void
  onDelete?: (post: Post) => void
}

export function LikesTab({
  profile,
  username,
  onReply,
  onRepost,
  onLike,
  onEdit,
  onDelete,
}: LikesTabProps) {
  const {
    data: likedPostsData,
    isLoading: loading,
    error,
  } = useLikedPostsQuery(username, profile)
  const likedPosts = likedPostsData?.posts ?? []

  return (
    <PostList
      posts={likedPosts}
      loading={loading}
      error={error?.message ?? null}
      onReply={onReply}
      onRepost={onRepost}
      onLike={onLike}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}

