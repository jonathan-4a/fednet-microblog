import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updatePost } from '../../services/posts'
import type { UpdatePostRequest, Post } from '../../types/posts'

interface UseUpdatePostMutationOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useUpdatePostMutation({
  onSuccess,
  onError,
}: UseUpdatePostMutationOptions = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      guid: string
      data: UpdatePostRequest
      author_username?: string
      noteId?: string
    }) => {
      return await updatePost(params.guid, params.data)
    },
    onMutate: async (params: {
      guid: string
      data: UpdatePostRequest
      author_username?: string
      noteId?: string
    }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      await queryClient.cancelQueries({ queryKey: ['post'] })
      await queryClient.cancelQueries({ queryKey: ['replies'] })
      await queryClient.cancelQueries({ queryKey: ['repliesDetails'] })
      await queryClient.cancelQueries({ queryKey: ['likedPosts'] })

      // Snapshot previous values
      const previousQueries = queryClient.getQueriesData({
        predicate: (query) =>
          ['posts', 'post', 'replies', 'repliesDetails', 'likedPosts'].some(
            (key) => query.queryKey[0] === key
          ),
      })

      // Optimistically update the post content everywhere it appears
      queryClient.setQueriesData(
        { queryKey: ['posts'] },
        (old: any) => {
          if (!old) return old
          if (Array.isArray(old)) {
            return old.map((p: Post) => {
              const matches =
                (params.noteId && p.noteId === params.noteId) ||
                (p.guid === params.guid &&
                  params.author_username &&
                  p.author_username === params.author_username)
              return matches
                ? { ...p, content: params.data.content }
                : p
            })
          }
          return old
        }
      )
      
      queryClient.setQueriesData(
        { queryKey: ['post'] },
        (old: any) => {
          if (!old) return old
          const matches =
            (params.noteId && old.noteId === params.noteId) ||
            (old.guid === params.guid &&
              params.author_username &&
              old.author_username === params.author_username)
          return matches ? { ...old, content: params.data.content } : old
        }
      )
      
      queryClient.setQueriesData(
        { queryKey: ['repliesDetails'] },
        (old: any) => {
          if (!old || !old.replies) return old
          return {
            ...old,
            replies: old.replies.map((p: Post) => {
              const matches =
                (params.noteId && p.noteId === params.noteId) ||
                (p.guid === params.guid &&
                  params.author_username &&
                  p.author_username === params.author_username)
              return matches ? { ...p, content: params.data.content } : p
            }),
          }
        }
      )

      return { previousQueries }
    },
    onSuccess: () => {
      // Mark queries as stale but don't immediately refetch
      queryClient.invalidateQueries({
        queryKey: ['posts'],
        refetchType: 'none',
      })
      queryClient.invalidateQueries({
        queryKey: ['post'],
        refetchType: 'none',
      })
      queryClient.invalidateQueries({
        queryKey: ['replies'],
        refetchType: 'none',
      })
      queryClient.invalidateQueries({
        queryKey: ['repliesDetails'],
        refetchType: 'none',
      })
      queryClient.invalidateQueries({
        queryKey: ['likedPosts'],
        refetchType: 'none',
      })

      // Refetch after a short delay to sync with server
      setTimeout(async () => {
        await queryClient.refetchQueries({ queryKey: ['posts'] })
        await queryClient.refetchQueries({ queryKey: ['post'] })
        await queryClient.refetchQueries({ queryKey: ['replies'] })
        await queryClient.refetchQueries({ queryKey: ['repliesDetails'] })
        await queryClient.refetchQueries({ queryKey: ['likedPosts'] })
      }, 500)

      onSuccess?.()
    },
    onError: (error: unknown, _params, context) => {
      // Rollback optimistic update on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          if (data) {
            queryClient.setQueryData(queryKey, data)
          }
        })
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Failed to update post'
      onError?.(new Error(errorMessage))
    },
  })
}

