import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPost } from '../../services/posts'
import { useAuthContext } from '../../hooks/useAuthContext'
import type { CreatePostRequest } from '../../types/posts'

export function useCreatePostMutation() {
  const queryClient = useQueryClient()
  const { user } = useAuthContext()

  return useMutation({
    mutationFn: async (data: CreatePostRequest) => {
      if (!user?.username) {
        throw new Error('User not authenticated')
      }
      return await createPost(user.username, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post'] })
      queryClient.invalidateQueries({ queryKey: ['repliesDetails'] })
      queryClient.invalidateQueries({ queryKey: ['replies'] })

      if (variables.inReplyTo) {
        const match = variables.inReplyTo.match(
          /\/u\/([^\/]+)\/statuses\/(.+)$/
        )
        if (match) {
          const [, username, guid] = match
          queryClient.invalidateQueries({
            queryKey: ['repliesDetails', username, guid],
          })
          queryClient.invalidateQueries({
            queryKey: ['post', username, guid],
          })
          queryClient.refetchQueries({
            queryKey: ['repliesDetails', username, guid],
          })
        } else {
          const hashMatch = variables.inReplyTo.match(/\/u\/([^#]+)#(.+)$/)
          if (hashMatch) {
            const [, username, guid] = hashMatch
            queryClient.invalidateQueries({
              queryKey: ['repliesDetails', username, guid],
            })
            queryClient.invalidateQueries({
              queryKey: ['post', username, guid],
            })
            queryClient.refetchQueries({
              queryKey: ['repliesDetails', username, guid],
            })
          }
        }
      }
    },
  })
}

