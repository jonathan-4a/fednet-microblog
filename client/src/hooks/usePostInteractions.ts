// src/hooks/usePostInteractions.ts
import { useState } from 'react'
import { useLikeMutation } from './mutations/useLikeMutation'
import { useSnackbar } from './useSnackbar'
import { API_BASE } from '../config'
import type { Post } from '../types/posts'

export function usePostInteractions(currentUsername?: string | null | undefined) {
  const { showError } = useSnackbar()
  const [replyPost, setReplyPost] = useState<Post | null>(null)
  const [replyDialogOpen, setReplyDialogOpen] = useState(false)
  const [repostPost, setRepostPost] = useState<Post | null>(null)
  const [repostDialogOpen, setRepostDialogOpen] = useState(false)

  const { like, unlike } = useLikeMutation({
    currentUsername: currentUsername || undefined,
  })

  const handleReply = (post: Post) => {
    setReplyPost(post)
    setReplyDialogOpen(true)
  }

  const handleRepost = (post: Post) => {
    setRepostPost(post)
    setRepostDialogOpen(true)
  }

  const handleLike = async (post: Post) => {
    const noteId =
      post.noteId ||
      (post.author_username && post.guid
        ? `${API_BASE}/u/${post.author_username}/statuses/${post.guid}`
        : '')
    if (!noteId) {
      showError('Post ID not available')
      return
    }
    try {
      if (post.isLiked) {
        await unlike({ post, noteId })
      } else {
        await like({ post, noteId })
      }
    } catch {
      // Error handled by hook
    }
  }

  const closeReplyDialog = () => {
    setReplyDialogOpen(false)
    setReplyPost(null)
  }

  const closeRepostDialog = () => {
    setRepostDialogOpen(false)
    setRepostPost(null)
  }

  return {
    handleReply,
    handleRepost,
    handleLike,
    replyPost,
    replyDialogOpen,
    closeReplyDialog,
    repostPost,
    repostDialogOpen,
    closeRepostDialog,
  }
}


