import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postOutbox } from '../../services/federation'
import {
  createFollowActivity,
  createUndoFollowActivity,
} from '../../types/activitypub'
import { API_BASE } from '../../config'

interface UseFollowMutationOptions {
  currentUsername: string | undefined
  onSuccess?: () => void
  onError?: (error: string) => void
}

interface FollowMutationParams {
  targetActorUrl: string
  targetUsername?: string
  targetFollowersUrl?: string
}

export function useFollowMutation({
  currentUsername,
  onSuccess,
  onError,
}: UseFollowMutationOptions) {
  const queryClient = useQueryClient()

  const follow = useMutation({
    mutationFn: async (params: FollowMutationParams) => {
      if (!currentUsername) {
        throw new Error('User not authenticated')
      }
      // Build current user's actor URL
      const currentUserActorUrl = `${API_BASE}/u/${currentUsername}`
      const activity = createFollowActivity({
        actorUrl: currentUserActorUrl,
        targetActorUrl: params.targetActorUrl,
      })
      const response = await postOutbox(
        currentUsername,
        activity as unknown as Record<string, unknown>
      )
      if (response.status !== 'accepted') {
        throw new Error('Follow request was not accepted')
      }
    },
    onMutate: async (params: FollowMutationParams) => {
      if (!currentUsername) return

      // Build current user's actor URL
      const currentUserActorUrl = `${API_BASE}/u/${currentUsername}`
      const { targetActorUrl, targetUsername, targetFollowersUrl } = params

      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: ['following', currentUsername],
      })
      await queryClient.cancelQueries({ queryKey: ['followers'] })
      await queryClient.cancelQueries({ queryKey: ['profile'] })

      // Get all following queries for current user to update them all
      const allFollowingQueries = queryClient.getQueriesData({
        queryKey: ['following', currentUsername],
      })

      // Snapshot the previous values
      const previousFollowing = allFollowingQueries[0]?.[1] || null
      const previousFollowers =
        queryClient.getQueryData([
          'followers',
          targetUsername,
          targetFollowersUrl,
        ]) || queryClient.getQueryData(['followers', targetUsername])
      const previousProfile = queryClient.getQueryData(['profile'])

      // Optimistically update current user's following list
      const updateFollowing = (old: any) => {
        const newPage = {
          '@context': 'https://www.w3.org/ns/activitystreams',
          type: 'OrderedCollection',
          orderedItems: [targetActorUrl],
          totalItems: 1,
        }
        const addToPage = (page: any) => {
          if (!page) return newPage
          const existing = page.orderedItems || []
          if (existing.includes(targetActorUrl)) return page
          return {
            ...page,
            orderedItems: [...existing, targetActorUrl],
            totalItems: (page.totalItems || 0) + 1,
          }
        }
        if (!old) return { pages: [newPage], pageParams: [undefined] }
        if (old.pages && Array.isArray(old.pages) && old.pages.length > 0) {
          return { ...old, pages: [addToPage(old.pages[0]), ...old.pages.slice(1)] }
        }
        return { ...old, pages: [newPage], pageParams: [undefined] }
      }

      // Optimistically update target profile's followers list (useInfiniteQuery shape: { pages, pageParams })
      const updateFollowersInfinite = (old: any) => {
        const newPage = {
          '@context': 'https://www.w3.org/ns/activitystreams',
          type: 'OrderedCollection',
          id: targetFollowersUrl,
          orderedItems: [currentUserActorUrl],
          totalItems: 1,
        }
        const addToPage = (page: any) => {
          if (!page) return newPage
          const existing = page.orderedItems || []
          if (existing.includes(currentUserActorUrl)) return page
          return {
            ...page,
            orderedItems: [...existing, currentUserActorUrl],
            totalItems: (page.totalItems || 0) + 1,
          }
        }
        if (!old) {
          return { pages: [newPage], pageParams: [undefined] }
        }
        if (old.pages && Array.isArray(old.pages) && old.pages.length > 0) {
          return {
            ...old,
            pages: [addToPage(old.pages[0]), ...old.pages.slice(1)],
          }
        }
        return { ...old, pages: [newPage], pageParams: [undefined] }
      }

      // Update all following queries for current user
      queryClient.setQueriesData(
        { queryKey: ['following', currentUsername] },
        updateFollowing
      )

      // Update target profile's followers list (if we have the info)
      if (targetUsername || targetFollowersUrl) {
        queryClient.setQueryData(
          ['followers', targetUsername, targetFollowersUrl],
          updateFollowersInfinite
        )
        queryClient.setQueryData(['followers', targetUsername], updateFollowersInfinite)
        // Remote profile page uses ['followers', undefined, followersUrl]
        if (targetFollowersUrl) {
          queryClient.setQueryData(
            ['followers', undefined, targetFollowersUrl],
            updateFollowersInfinite
          )
        }
      }

      return { previousFollowing, previousFollowers, previousProfile }
    },
    onSuccess: async () => {
      // Mark queries as stale but don't immediately refetch to avoid race conditions
      // The optimistic update will persist until the next natural refetch or manual refetch
      queryClient.invalidateQueries({
        queryKey: ['followers'],
        refetchType: 'none', // Don't refetch immediately
      })
      queryClient.invalidateQueries({
        queryKey: ['following'],
        refetchType: 'none',
      })
      queryClient.invalidateQueries({
        queryKey: ['profile'],
        refetchType: 'none',
      })
      queryClient.invalidateQueries({
        queryKey: ['currentUserProfile'],
        refetchType: 'none',
      })

      // Refetch only after a short delay to ensure server has processed the change
      setTimeout(async () => {
        await queryClient.refetchQueries({
          queryKey: ['followers'],
        })
        await queryClient.refetchQueries({
          queryKey: ['following', currentUsername],
        })
        await queryClient.refetchQueries({
          queryKey: ['profile'],
        })
        await queryClient.refetchQueries({
          queryKey: ['currentUserProfile'],
        })
      }, 500)

      onSuccess?.()
    },
    onError: (error: Error, params: FollowMutationParams, context) => {
      // Rollback optimistic update on error
      if (context?.previousFollowing && currentUsername) {
        queryClient.setQueriesData(
          { queryKey: ['following', currentUsername] },
          () => context.previousFollowing
        )
      }
      if (
        context?.previousFollowers &&
        (params.targetUsername || params.targetFollowersUrl)
      ) {
        queryClient.setQueryData(
          ['followers', params.targetUsername, params.targetFollowersUrl],
          context.previousFollowers
        )
        queryClient.setQueryData(
          ['followers', params.targetUsername],
          context.previousFollowers
        )
      }
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile'], context.previousProfile)
      }
      onError?.(error.message)
    },
  })

  const unfollow = useMutation({
    mutationFn: async (params: FollowMutationParams) => {
      if (!currentUsername) {
        throw new Error('User not authenticated')
      }
      // Build current user's actor URL
      const currentUserActorUrl = `${API_BASE}/u/${currentUsername}`
      const activity = createUndoFollowActivity({
        actorUrl: currentUserActorUrl,
        targetActorUrl: params.targetActorUrl,
      })
      const response = await postOutbox(
        currentUsername,
        activity as unknown as Record<string, unknown>
      )
      if (response.status !== 'accepted') {
        throw new Error('Unfollow request was not accepted')
      }
    },
    onMutate: async (params: FollowMutationParams) => {
      if (!currentUsername) return

      // Build current user's actor URL
      const currentUserActorUrl = `${API_BASE}/u/${currentUsername}`
      const { targetActorUrl, targetUsername, targetFollowersUrl } = params

      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: ['following', currentUsername],
      })
      await queryClient.cancelQueries({ queryKey: ['followers'] })
      await queryClient.cancelQueries({ queryKey: ['profile'] })

      // Get all following queries for current user to update them all
      const allFollowingQueries = queryClient.getQueriesData({
        queryKey: ['following', currentUsername],
      })

      // Snapshot the previous values
      const previousFollowing = allFollowingQueries[0]?.[1] || null
      const previousFollowers =
        queryClient.getQueryData([
          'followers',
          targetUsername,
          targetFollowersUrl,
        ]) || queryClient.getQueryData(['followers', targetUsername])
      const previousProfile = queryClient.getQueryData(['profile'])

      // Optimistically update current user's following list (useInfiniteQuery shape)
      const updateFollowing = (old: any) => {
        const removeFromPage = (page: any) => {
          if (!page) return old
          const filtered = (page.orderedItems || []).filter(
            (id: string) => id !== targetActorUrl
          )
          return {
            ...page,
            orderedItems: filtered,
            totalItems: Math.max((page.totalItems || 0) - 1, 0),
          }
        }
        if (!old) return old
        if (old.pages && Array.isArray(old.pages) && old.pages.length > 0) {
          return {
            ...old,
            pages: [removeFromPage(old.pages[0]), ...old.pages.slice(1)],
          }
        }
        return old
      }

      // Optimistically update target profile's followers list (useInfiniteQuery shape)
      const updateFollowers = (old: any) => {
        const removeFromPage = (page: any) => {
          if (!page) return old
          const filtered = (page.orderedItems || []).filter(
            (id: string) => id !== currentUserActorUrl
          )
          return {
            ...page,
            orderedItems: filtered,
            totalItems: Math.max((page.totalItems || 0) - 1, 0),
          }
        }
        if (!old) return old
        if (old.pages && Array.isArray(old.pages) && old.pages.length > 0) {
          return {
            ...old,
            pages: [removeFromPage(old.pages[0]), ...old.pages.slice(1)],
          }
        }
        return old
      }

      // Update all following queries for current user
      queryClient.setQueriesData(
        { queryKey: ['following', currentUsername] },
        updateFollowing
      )

      // Update target profile's followers list (if we have the info)
      if (targetUsername || targetFollowersUrl) {
        queryClient.setQueryData(
          ['followers', targetUsername, targetFollowersUrl],
          updateFollowers
        )
        queryClient.setQueryData(['followers', targetUsername], updateFollowers)
        if (targetFollowersUrl) {
          queryClient.setQueryData(
            ['followers', undefined, targetFollowersUrl],
            updateFollowers
          )
        }
      }

      return { previousFollowing, previousFollowers, previousProfile }
    },
    onSuccess: async () => {
      // Mark queries as stale but don't immediately refetch to avoid race conditions
      // The optimistic update will persist until the next natural refetch or manual refetch
      queryClient.invalidateQueries({
        queryKey: ['followers'],
        refetchType: 'none', // Don't refetch immediately
      })
      queryClient.invalidateQueries({
        queryKey: ['following'],
        refetchType: 'none',
      })
      queryClient.invalidateQueries({
        queryKey: ['profile'],
        refetchType: 'none',
      })
      queryClient.invalidateQueries({
        queryKey: ['currentUserProfile'],
        refetchType: 'none',
      })

      // Refetch only after a short delay to ensure server has processed the change
      setTimeout(async () => {
        await queryClient.refetchQueries({
          queryKey: ['followers'],
        })
        await queryClient.refetchQueries({
          queryKey: ['following', currentUsername],
        })
        await queryClient.refetchQueries({
          queryKey: ['profile'],
        })
        await queryClient.refetchQueries({
          queryKey: ['currentUserProfile'],
        })
      }, 500)

      onSuccess?.()
    },
    onError: (error: Error, params: FollowMutationParams, context) => {
      // Rollback optimistic update on error
      if (context?.previousFollowing && currentUsername) {
        queryClient.setQueriesData(
          { queryKey: ['following', currentUsername] },
          () => context.previousFollowing
        )
      }
      if (
        context?.previousFollowers &&
        (params.targetUsername || params.targetFollowersUrl)
      ) {
        queryClient.setQueryData(
          ['followers', params.targetUsername, params.targetFollowersUrl],
          context.previousFollowers
        )
        queryClient.setQueryData(
          ['followers', params.targetUsername],
          context.previousFollowers
        )
      }
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile'], context.previousProfile)
      }
      onError?.(error.message)
    },
  })

  return {
    follow: follow.mutateAsync,
    unfollow: unfollow.mutateAsync,
    followLoading: follow.isPending,
    unfollowLoading: unfollow.isPending,
  }
}



