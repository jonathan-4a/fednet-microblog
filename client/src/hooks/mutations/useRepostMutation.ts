// src/hooks/mutations/useRepostMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { repostPost } from '../../services/posts/api'
import { useAuthContext } from '../../hooks/useAuthContext'

export function useRepostMutation(options?: { onError?: (error: Error) => void }) {
  const queryClient = useQueryClient()
  const { user } = useAuthContext()

  return useMutation({
    mutationFn: async (noteId: string) => {
      if (!user?.username) {
        throw new Error('User not authenticated')
      }
      return await repostPost(user.username, noteId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post'] })
      queryClient.invalidateQueries({ queryKey: ['repliesDetails'] })
      queryClient.invalidateQueries({ queryKey: ['replies'] })
      queryClient.invalidateQueries({ queryKey: ['reposts'] })
    },
    onError: options?.onError,
  })
}

