// src/hooks/mutations/useLikeMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postOutbox } from '../../services/federation'
import { createLikeActivity } from '../../types/activitypub'
import type { Post } from '../../types/posts'
import { API_BASE } from '../../config'
import { useSnackbar } from '../useSnackbar'

interface UseLikeMutationOptions {
  currentUsername: string | undefined
  onSuccess?: () => void
  onError?: (error: string) => void
}

interface LikeMutationParams {
  post: Post
  noteId: string
}

export function useLikeMutation({
  currentUsername,
  onSuccess,
  onError,
}: UseLikeMutationOptions) {
  const queryClient = useQueryClient()
  const { onRemoteError } = useSnackbar()
  const handleError = onError ?? onRemoteError

  const like = useMutation({
    mutationFn: async (params: LikeMutationParams) => {
      if (!currentUsername) {
        throw new Error('User not authenticated')
      }
      const actorUrl = `${API_BASE}/u/${currentUsername}`
      const activity = createLikeActivity({
        actorUrl,
        objectId: params.noteId,
      })
      const response = await postOutbox(
        currentUsername,
        activity as unknown as Record<string, unknown>
      )
      if (response.status !== 'accepted') {
        throw new Error('Like request was not accepted')
      }
    },
    onMutate: async (params: LikeMutationParams) => {
      if (!currentUsername) return

      const { post, noteId } = params

      await queryClient.cancelQueries({ queryKey: ['posts'] })
      await queryClient.cancelQueries({ queryKey: ['likedPosts'] })
      await queryClient.cancelQueries({ queryKey: ['repliesDetails'] })
      await queryClient.cancelQueries({ queryKey: ['post'] })

      const previousPosts = queryClient.getQueriesData({ queryKey: ['posts'] })
      const previousLikedPosts = queryClient.getQueriesData({
        queryKey: ['likedPosts'],
      })
      const previousRepliesDetails = queryClient.getQueriesData({
        queryKey: ['repliesDetails'],
      })
      const previousPost = queryClient.getQueriesData({ queryKey: ['post'] })
      const updateLikedPostsCache = (old: any) => {
        if (!old) return old

        if (old.posts && Array.isArray(old.posts)) {
          // Check if post already exists in liked posts
          const exists = old.posts.some(
            (p: Post) =>
              (p.noteId && p.noteId === noteId) ||
              (p.guid === post.guid &&
                p.author_username === post.author_username)
          )

          if (exists) {
            // Update existing post
            return {
              ...old,
              posts: old.posts.map((p: Post) => {
                const matches =
                  (p.noteId && p.noteId === noteId) ||
                  (p.guid === post.guid &&
                    p.author_username === post.author_username)
                return matches
                  ? {
                      ...p,
                      isLiked: true,
                      likesCount: (p.likesCount || 0) + 1,
                      noteId: noteId,
                    }
                  : p
              }),
            }
          } else {
            // Add new post to liked list
            return {
              ...old,
              posts: [
                {
                  ...post,
                  isLiked: true,
                  likesCount: (post.likesCount || 0) + 1,
                  noteId: noteId,
                },
                ...old.posts,
              ],
              totalItems: (old.totalItems || 0) + 1,
            }
          }
        }

        return old
      }

      const updatePostInPages = (p: Post) =>
        (p.noteId && p.noteId === noteId) ||
        (p.guid === post.guid && p.author_username === post.author_username)
          ? { ...p, isLiked: true, likesCount: (p.likesCount || 0) + 1, noteId }
          : p

      queryClient.setQueriesData({ queryKey: ['posts'] }, (old: any) => {
        if (!old) return old
        if (old.pages && Array.isArray(old.pages)) {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              posts: (page.posts || []).map(updatePostInPages),
              replies: (page.replies || []).map(updatePostInPages),
            })),
          }
        }
        if (Array.isArray(old)) {
          return old.map(updatePostInPages)
        }
        return old
      })

      const updateReply = (r: Post) =>
        (r.noteId && r.noteId === noteId) ||
        (r.guid === post.guid && r.author_username === post.author_username)
          ? { ...r, isLiked: true, likesCount: (r.likesCount || 0) + 1, noteId }
          : r

      const updateRepliesDetailsCache = (old: any) => {
        if (!old) return old
        if (old.pages && Array.isArray(old.pages)) {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              replies: (page.replies || []).map(updateReply),
            })),
          }
        }
        if (old.replies && Array.isArray(old.replies)) {
          return { ...old, replies: old.replies.map(updateReply) }
        }
        return old
      }

      queryClient.setQueriesData(
        { queryKey: ['repliesDetails'] },
        updateRepliesDetailsCache
      )

      queryClient.setQueriesData({ queryKey: ['post'] }, (old: Post | null) => {
        if (!old) return old
        const matches =
          (old.noteId && old.noteId === noteId) ||
          (old.guid === post.guid && old.author_username === post.author_username)
        return matches
          ? { ...old, isLiked: true, likesCount: (old.likesCount || 0) + 1, noteId }
          : old
      })

      queryClient.setQueriesData(
        {
          queryKey: ['likedPosts'],
          predicate: (query) =>
            query.queryKey[0] === 'likedPosts' &&
            typeof query.queryKey[1] === 'string' &&
            query.queryKey[1].includes(`/u/${currentUsername}/liked`),
        },
        updateLikedPostsCache
      )

      return {
        previousPosts,
        previousLikedPosts,
        previousRepliesDetails,
        previousPost,
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['posts'],
        refetchType: 'none',
      })
      queryClient.invalidateQueries({
        queryKey: ['likedPosts'],
        refetchType: 'none',
      })
      queryClient.invalidateQueries({
        queryKey: ['repliesDetails'],
        refetchType: 'none',
      })
      queryClient.invalidateQueries({
        queryKey: ['post'],
        refetchType: 'none',
      })

      setTimeout(async () => {
        await queryClient.refetchQueries({ queryKey: ['posts'] })
        await queryClient.refetchQueries({ queryKey: ['likedPosts'] })
        await queryClient.refetchQueries({ queryKey: ['repliesDetails'] })
        await queryClient.refetchQueries({ queryKey: ['post'] })
      }, 500)

      onSuccess?.()
    },
    onError: (error: Error, _params: LikeMutationParams, context) => {
      if (context?.previousPosts) {
        context.previousPosts.forEach(([queryKey, data]) => {
          if (data) {
            queryClient.setQueryData(queryKey, data)
          }
        })
      }
      if (context?.previousLikedPosts) {
        context.previousLikedPosts.forEach(([queryKey, data]) => {
          if (data) {
            queryClient.setQueryData(queryKey, data)
          }
        })
      }
      if (context?.previousRepliesDetails) {
        context.previousRepliesDetails.forEach(([queryKey, data]) => {
          if (data) {
            queryClient.setQueryData(queryKey, data)
          }
        })
      }
      if (context?.previousPost) {
        context.previousPost.forEach(([queryKey, data]) => {
          if (data) {
            queryClient.setQueryData(queryKey, data)
          }
        })
      }
      handleError(error.message)
    },
  })

  const unlike = useMutation({
    mutationFn: async (params: LikeMutationParams) => {
      if (!currentUsername) {
        throw new Error('User not authenticated')
      }
      const actorUrl = `${API_BASE}/u/${currentUsername}`
      const likeActivity = createLikeActivity({
        actorUrl,
        objectId: params.noteId,
      })
      const undoActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Undo',
        actor: actorUrl,
        object: likeActivity,
      }
      const response = await postOutbox(
        currentUsername,
        undoActivity as unknown as Record<string, unknown>
      )
      if (response.status !== 'accepted') {
        throw new Error('Unlike request was not accepted')
      }
    },
    onMutate: async (params: LikeMutationParams) => {
      if (!currentUsername) return

      const { post, noteId } = params

      await queryClient.cancelQueries({ queryKey: ['posts'] })
      await queryClient.cancelQueries({ queryKey: ['likedPosts'] })
      await queryClient.cancelQueries({ queryKey: ['repliesDetails'] })
      await queryClient.cancelQueries({ queryKey: ['post'] })

      const previousPosts = queryClient.getQueriesData({ queryKey: ['posts'] })
      const previousLikedPosts = queryClient.getQueriesData({
        queryKey: ['likedPosts'],
      })
      const previousRepliesDetails = queryClient.getQueriesData({
        queryKey: ['repliesDetails'],
      })
      const previousPost = queryClient.getQueriesData({ queryKey: ['post'] })
      const updateLikedPostsCache = (old: any) => {
        if (!old) return old

        if (old.posts && Array.isArray(old.posts)) {
          const filteredPosts = old.posts.filter((p: Post) => {
            const matches =
              (p.noteId && p.noteId === noteId) ||
              (p.guid === post.guid &&
                p.author_username === post.author_username)
            return !matches
          })

          return {
            ...old,
            posts: filteredPosts,
            totalItems: Math.max((old.totalItems || 0) - 1, 0),
          }
        }

        return old
      }

      const updatePostInPages = (p: Post) =>
        (p.noteId && p.noteId === noteId) ||
        (p.guid === post.guid && p.author_username === post.author_username)
          ? {
              ...p,
              isLiked: false,
              likesCount: Math.max((p.likesCount || 0) - 1, 0),
              noteId,
            }
          : p

      queryClient.setQueriesData({ queryKey: ['posts'] }, (old: any) => {
        if (!old) return old
        if (old.pages && Array.isArray(old.pages)) {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              posts: (page.posts || []).map(updatePostInPages),
              replies: (page.replies || []).map(updatePostInPages),
            })),
          }
        }
        if (Array.isArray(old)) {
          return old.map(updatePostInPages)
        }
        return old
      })

      const updateReply = (r: Post) =>
        (r.noteId && r.noteId === noteId) ||
        (r.guid === post.guid && r.author_username === post.author_username)
          ? {
              ...r,
              isLiked: false,
              likesCount: Math.max((r.likesCount || 0) - 1, 0),
              noteId,
            }
          : r

      const updateRepliesDetailsCache = (old: any) => {
        if (!old) return old
        if (old.pages && Array.isArray(old.pages)) {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              replies: (page.replies || []).map(updateReply),
            })),
          }
        }
        if (old.replies && Array.isArray(old.replies)) {
          return { ...old, replies: old.replies.map(updateReply) }
        }
        return old
      }

      queryClient.setQueriesData(
        { queryKey: ['repliesDetails'] },
        updateRepliesDetailsCache
      )

      queryClient.setQueriesData({ queryKey: ['post'] }, (old: Post | null) => {
        if (!old) return old
        const matches =
          (old.noteId && old.noteId === noteId) ||
          (old.guid === post.guid && old.author_username === post.author_username)
        return matches
          ? {
              ...old,
              isLiked: false,
              likesCount: Math.max((old.likesCount || 0) - 1, 0),
              noteId,
            }
          : old
      })

      queryClient.setQueriesData(
        {
          queryKey: ['likedPosts'],
          predicate: (query) =>
            query.queryKey[0] === 'likedPosts' &&
            typeof query.queryKey[1] === 'string' &&
            query.queryKey[1].includes(`/u/${currentUsername}/liked`),
        },
        updateLikedPostsCache
      )

      return {
        previousPosts,
        previousLikedPosts,
        previousRepliesDetails,
        previousPost,
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['posts'],
        refetchType: 'none',
      })
      queryClient.invalidateQueries({
        queryKey: ['likedPosts'],
        refetchType: 'none',
      })
      queryClient.invalidateQueries({
        queryKey: ['repliesDetails'],
        refetchType: 'none',
      })
      queryClient.invalidateQueries({
        queryKey: ['post'],
        refetchType: 'none',
      })

      setTimeout(async () => {
        await queryClient.refetchQueries({ queryKey: ['posts'] })
        await queryClient.refetchQueries({ queryKey: ['likedPosts'] })
        await queryClient.refetchQueries({ queryKey: ['repliesDetails'] })
        await queryClient.refetchQueries({ queryKey: ['post'] })
      }, 500)

      onSuccess?.()
    },
    onError: (error: Error, _params: LikeMutationParams, context) => {
      if (context?.previousPosts) {
        context.previousPosts.forEach(([queryKey, data]) => {
          if (data) {
            queryClient.setQueryData(queryKey, data)
          }
        })
      }
      if (context?.previousLikedPosts) {
        context.previousLikedPosts.forEach(([queryKey, data]) => {
          if (data) {
            queryClient.setQueryData(queryKey, data)
          }
        })
      }
      if (context?.previousRepliesDetails) {
        context.previousRepliesDetails.forEach(([queryKey, data]) => {
          if (data) {
            queryClient.setQueryData(queryKey, data)
          }
        })
      }
      if (context?.previousPost) {
        context.previousPost.forEach(([queryKey, data]) => {
          if (data) {
            queryClient.setQueryData(queryKey, data)
          }
        })
      }
      handleError(error.message)
    },
  })

  return {
    like: like.mutateAsync,
    unlike: unlike.mutateAsync,
    likeLoading: like.isPending,
    unlikeLoading: unlike.isPending,
  }
}

