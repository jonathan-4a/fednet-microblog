import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Box, CircularProgress, Typography, Button } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import IconButton from '@mui/material/IconButton'
import { useInView } from 'react-intersection-observer'
import { useEffect } from 'react'
import { API_BASE } from '../config'
import { TwitterLayout } from '../components/layout/TwitterLayout'
import { PostCard } from '../components/post/PostCard'
import { ReplyThread } from '../components/post/ReplyThread'
import { ReplyDialog } from '../components/ReplyDialog'
import { RepostDialog } from '../components/RepostDialog'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { EmptyState } from '../components/EmptyState'
import { usePostQuery } from '../hooks/queries/usePostQuery'
import { usePostRepliesDetailsQuery } from '../hooks/queries/usePostRepliesDetailsQuery'
import { useLikeMutation } from '../hooks/mutations/useLikeMutation'
import { useUpdatePostMutation } from '../hooks/mutations/useUpdatePostMutation'
import { useDeletePostMutation } from '../hooks/mutations/useDeletePostMutation'
import { useAuthStore } from '../stores/authStore'
import { useProfileDataQuery } from '../hooks/useProfileDataQuery'
import { useState } from 'react'
import type { Post } from '../types/posts'
import { logger } from '../utils/logger'
import { EditPostDialog } from '../components/EditPostDialog'
import { DeletePostDialog } from '../components/DeletePostDialog'
import { useSnackbar } from '../hooks/useSnackbar'
import { SnackbarNotification } from '../components/SnackbarNotification'

export function PostDetailPage() {
  const { username, guid } = useParams<{ username?: string; guid?: string }>()
  const [searchParams] = useSearchParams()
  const urlParam = searchParams.get('url')
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const [replyDialogOpen, setReplyDialogOpen] = useState(false)
  const [replyPost, setReplyPost] = useState<Post | null>(null)
  const [repostDialogOpen, setRepostDialogOpen] = useState(false)
  const [repostPost, setRepostPost] = useState<Post | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editPost, setEditPost] = useState<Post | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletePost, setDeletePost] = useState<Post | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { snackbar, showError, closeSnackbar } = useSnackbar()

  const { mutateAsync: updatePostMutation } = useUpdatePostMutation({
    onError: (error) => {
      showError(error.message || 'Failed to update post')
    },
  })

  const { mutateAsync: deletePostMutation, isPending: deletePostLoading } =
    useDeletePostMutation({
      onError: (error) => {
        setIsDeleting(false)
        showError(error.message || 'Failed to delete post')
      },
    })

  const postUrl = urlParam || (username && guid ? `${API_BASE}/u/${username}/statuses/${guid}` : null)

  if (!postUrl) {
    return (
      <TwitterLayout>
        <Box sx={{ px: 3, py: 4 }}>
          <ErrorDisplay message='Invalid post URL' />
        </Box>
      </TwitterLayout>
    )
  }

  const {
    data: post,
    isLoading: postLoading,
    error: postError,
  } = usePostQuery(postUrl)

  const {
    data: repliesData,
    isLoading: repliesLoading,
    error: repliesError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePostRepliesDetailsQuery(postUrl, { limit: 20 })

  const { profile } = useProfileDataQuery()
  const { like, unlike } = useLikeMutation({
    currentUsername: currentUser?.username,
  })

  const handleBack = () => {
    navigate(-1)
  }

  const handleReply = (post: Post) => {
    setReplyPost(post)
    setReplyDialogOpen(true)
  }

  const handleRepost = (post: Post) => {
    setRepostPost(post)
    setRepostDialogOpen(true)
  }

  const handleLike = async (post: Post) => {
    const noteId = post.noteId || `/u/${post.author_username}/statuses/${post.guid}`
    if (!noteId) {
      logger.error('Post ID not available for like')
      return
    }
    try {
      post.isLiked ? await unlike({ post, noteId }) : await like({ post, noteId })
    } catch {
      // Error handled by hook
    }
  }

  const handleReplySuccess = () => {
    setReplyDialogOpen(false)
    setReplyPost(null)
  }

  const handleEdit = (post: Post) => {
    setEditPost(post)
    setEditDialogOpen(true)
  }

  const handleDelete = (post: Post) => {
    setDeletePost(post)
    setDeleteDialogOpen(true)
  }

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !repliesLoading) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, repliesLoading, fetchNextPage])

  if (postLoading) {
    return (
      <TwitterLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <LoadingSpinner />
        </Box>
      </TwitterLayout>
    )
  }

  if ((postError || !post) && !isDeleting) {
    return (
      <TwitterLayout>
        <Box sx={{ px: 3, py: 4 }}>
          <ErrorDisplay message={postError?.message || 'Post not found'} />
        </Box>
      </TwitterLayout>
    )
  }

  if (isDeleting) {
    return (
      <TwitterLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <LoadingSpinner />
        </Box>
      </TwitterLayout>
    )
  }

  const replies = repliesData?.pages.flatMap(page => page.replies) || []
  const authorDisplayName =
    profile?.name || profile?.preferredUsername || post?.author_username || ''

  return (
    <TwitterLayout>
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'rgba(0, 0, 0, 0.08)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={handleBack}
              sx={{
                mr: 2,
                color: 'text.primary',
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: 700,
                color: 'text.primary',
              }}
            >
              Post
            </Typography>
          </Box>
          {post && (
            <Button
              onClick={() => handleReply(post)}
              variant='contained'
              sx={{
                borderRadius: 25,
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                backgroundColor: 'primary.main',
                color: '#fff',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              Reply
            </Button>
          )}
        </Box>

        {post && (
          <Box
            sx={{
              borderBottom: '1px solid',
              borderColor: 'rgba(0, 0, 0, 0.08)',
              borderLeft: '3px solid',
              borderLeftColor: 'primary.main',
              pl: 0,
            }}
          >
            <PostCard
              post={post}
              authorDisplayName={authorDisplayName}
              authorUsername={post.author_username}
              onReply={handleReply}
              onRepost={handleRepost}
              onLike={handleLike}
              onEdit={handleEdit}
              onDelete={handleDelete}
              clickable={false}
            />
          </Box>
        )}

        {repliesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : repliesError ? (
          <Box sx={{ px: 3, py: 2 }}>
            <ErrorDisplay message={repliesError.message} />
          </Box>
        ) : replies.length === 0 ? (
          <Box sx={{ px: 3, py: 4 }}>
            <EmptyState message='No replies yet' />
          </Box>
        ) : (
          <>
            <ReplyThread
              replies={replies}
              authorDisplayName={authorDisplayName}
              authorUsername={post?.author_username || ''}
              onReply={handleReply}
              onLike={handleLike}
            />
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
          </>
        )}

        {replyPost && (
          <ReplyDialog
            open={replyDialogOpen}
            onClose={() => {
              setReplyDialogOpen(false)
              setReplyPost(null)
            }}
            post={replyPost}
            onSuccess={handleReplySuccess}
          />
        )}

        {repostPost && (
          <RepostDialog
            open={repostDialogOpen}
            onClose={() => {
              setRepostDialogOpen(false)
              setRepostPost(null)
            }}
            post={repostPost}
            onSuccess={() => {}}
          />
        )}

        {editPost && (
          <EditPostDialog
            open={editDialogOpen}
            onClose={() => {
              setEditDialogOpen(false)
              setEditPost(null)
            }}
            post={editPost}
            onSubmit={async (guid, content) => {
              await updatePostMutation({
                guid,
                data: { content },
                author_username: editPost?.author_username,
                noteId: editPost?.noteId,
              })
            }}
            onSuccess={() => {
              setEditDialogOpen(false)
              setEditPost(null)
            }}
          />
        )}

        {deletePost && (
          <DeletePostDialog
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false)
              setDeletePost(null)
            }}
            post={deletePost}
            loading={deletePostLoading}
            onConfirm={async () => {
              const postToDelete = deletePost
              setIsDeleting(true)
              setDeleteDialogOpen(false)
              setDeletePost(null)

              try {
                navigate('/')
                await deletePostMutation({
                  guid: postToDelete.guid,
                  author_username: postToDelete.author_username,
                  noteId: postToDelete.noteId,
                })
              } catch {
                setIsDeleting(false)
              }
            }}
          />
        )}

        <SnackbarNotification
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={closeSnackbar}
        />
      </Box>
    </TwitterLayout>
  )
}

