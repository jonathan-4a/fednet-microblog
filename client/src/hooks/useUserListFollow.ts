// src/hooks/useUserListFollow.ts
import { useState, useEffect } from 'react'
import { useFollowMutation } from './mutations/useFollowMutation'
import { parseActorUrl } from '../utils/actor'
import type { OrderedCollection } from '../types/activitypub'

interface UseUserListFollowOptions {
  currentUsername: string | undefined
  currentUserFollowing: OrderedCollection | null | undefined
  refetchCurrentUserFollowing: () => Promise<void>
  onError?: (message: string) => void
}

export function useUserListFollow({
  currentUsername,
  currentUserFollowing,
  refetchCurrentUserFollowing,
  onError,
}: UseUserListFollowOptions) {
  const [userFollowLoading, setUserFollowLoading] = useState<
    Record<string, boolean>
  >({})
  const [optimisticUserFollowing, setOptimisticUserFollowing] = useState<
    Record<string, boolean | null>
  >({})

  const { follow, unfollow } = useFollowMutation({
    currentUsername,
    onSuccess: () => {
      refetchCurrentUserFollowing()
    },
    onError: (error) => {
      onError?.(error)
    },
  })

  const performFollow = async (targetActorId: string) => {
    if (!currentUsername) return

    setOptimisticUserFollowing((prev) => ({
      ...prev,
      [targetActorId]: true,
    }))
    setUserFollowLoading((prev) => ({ ...prev, [targetActorId]: true }))

    try {
      // Parse actor URL to extract username for followers URL
      const parsed = parseActorUrl(targetActorId)
      const targetFollowersUrl = parsed.isLocal
        ? `${targetActorId}/followers`
        : undefined

      await follow({
        targetActorUrl: targetActorId,
        targetUsername: parsed.username,
        targetFollowersUrl,
      })
    } catch (err) {
      // Revert optimistic state on error
      setOptimisticUserFollowing((prev) => ({
        ...prev,
        [targetActorId]: false,
      }))
    } finally {
      setUserFollowLoading((prev) => ({ ...prev, [targetActorId]: false }))
    }
  }

  const performUnfollow = async (targetActorId: string) => {
    if (!currentUsername) return

    setOptimisticUserFollowing((prev) => ({
      ...prev,
      [targetActorId]: false,
    }))
    setUserFollowLoading((prev) => ({ ...prev, [targetActorId]: true }))

    try {
      // Parse actor URL to extract username for followers URL
      const parsed = parseActorUrl(targetActorId)
      const targetFollowersUrl = parsed.isLocal
        ? `${targetActorId}/followers`
        : undefined

      await unfollow({
        targetActorUrl: targetActorId,
        targetUsername: parsed.username,
        targetFollowersUrl,
      })
    } catch (err) {
      // Revert optimistic state on error
      setOptimisticUserFollowing((prev) => ({
        ...prev,
        [targetActorId]: true,
      }))
    } finally {
      setUserFollowLoading((prev) => ({ ...prev, [targetActorId]: false }))
    }
  }

  const handleUserFollow = (targetActorId: string): string | null => {
    if (!currentUsername) return null

    // Get current state (use optimistic if available, otherwise check API)
    const currentOptimistic = optimisticUserFollowing[targetActorId]
    const isCurrentlyFollowing =
      currentOptimistic !== null && currentOptimistic !== undefined
        ? currentOptimistic
        : currentUserFollowing?.orderedItems?.includes(targetActorId) ?? false

    if (isCurrentlyFollowing) {
      // Return the actorId to trigger dialog - the component will handle showing it
      return targetActorId
    } else {
      // Follow immediately
      performFollow(targetActorId)
      return null
    }
  }

  const isUserFollowing = (actorId: string): boolean => {
    // Use optimistic state if available, otherwise check from API
    const optimistic = optimisticUserFollowing[actorId]
    if (optimistic !== null && optimistic !== undefined) {
      return optimistic
    }
    return currentUserFollowing?.orderedItems?.includes(actorId) ?? false
  }

  // Clear optimistic state when API state matches
  useEffect(() => {
    if (!currentUserFollowing) return

    Object.keys(optimisticUserFollowing).forEach((actorId) => {
      const optimistic = optimisticUserFollowing[actorId]
      if (optimistic === null || optimistic === undefined) return

      const apiConfirmed =
        currentUserFollowing.orderedItems?.includes(actorId) === optimistic
      if (apiConfirmed) {
        setOptimisticUserFollowing((prev) => {
          const updated = { ...prev }
          delete updated[actorId]
          return updated
        })
      }
    })
  }, [currentUserFollowing, optimisticUserFollowing])

  return {
    handleUserFollow: handleUserFollow as (
      targetActorId: string
    ) => string | null,
    performFollow,
    performUnfollow,
    isUserFollowing,
    userFollowLoading,
  }
}

