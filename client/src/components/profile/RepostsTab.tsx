import { PostList } from '../post/PostList'
import { useUserPostsQuery } from '../../hooks/queries/useUserPostsQuery'
import type { Post } from '../../types/posts'
import type { Actor } from '../../types/activitypub'

export interface RepostsTabProps {
  username?: string
  profile: Actor
  onReply: (post: Post) => void
  onRepost: (post: Post) => void
  onLike: (post: Post) => void
  onEdit?: (post: Post) => void
  onDelete?: (post: Post) => void
}

export function RepostsTab({
  username,
  profile,
  onReply,
  onRepost,
  onLike,
  onEdit,
  onDelete,
}: RepostsTabProps) {
  const {
    data: postsData,
    isLoading: loading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useUserPostsQuery(username, profile)

  const allPosts = postsData?.pages.flatMap((page) => page.posts) ?? []
  const reposts = allPosts.filter((p) => p.isRepost === true)
  const postsPrivate = postsData?.pages?.[0]?.private === true

  return (
    <PostList
      posts={reposts}
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
      privateMessage="This information is private."
      emptyMessage="No reposts yet"
    />
  )
}

