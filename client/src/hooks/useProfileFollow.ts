// src/hooks/useProfileFollow.ts
import { useState, useEffect, useRef } from 'react'
import { useFollowMutation } from './mutations/useFollowMutation'
import type { OrderedCollection } from '../types/activitypub'

interface UseProfileFollowOptions {
  currentUser: { username: string | null } | null
  targetProfileId: string
  currentUserFollowing: OrderedCollection | null | undefined
  onError?: (message: string) => void
}

export function useProfileFollow({
  currentUser,
  targetProfileId,
  currentUserFollowing,
  onError,
}: UseProfileFollowOptions) {
  const [optimisticFollowing, setOptimisticFollowing] = useState<
    boolean | null
  >(null)
  const mutationJustCompletedRef = useRef(false)
  const mutationSuccessTimeRef = useRef<number | null>(null)

  const { follow, unfollow, followLoading, unfollowLoading } =
    useFollowMutation({
      currentUsername: currentUser?.username ?? undefined,
      onSuccess: () => {
        // Mark that mutation completed and record time - useEffect will handle clearing after refetch
        mutationJustCompletedRef.current = true
        mutationSuccessTimeRef.current = Date.now()
      },
      onError: (error) => {
        mutationJustCompletedRef.current = false
        mutationSuccessTimeRef.current = null
        // Revert optimistic state: if optimistic was true (trying to follow), revert to false
        // If optimistic was false (trying to unfollow), revert to true
        if (optimisticFollowing === true) {
          setOptimisticFollowing(false) // Follow failed, revert to not following
        } else if (optimisticFollowing === false) {
          setOptimisticFollowing(true) // Unfollow failed, revert to following
        } else {
          setOptimisticFollowing(null) // No optimistic state, just clear it
        }
        onError?.(error)
      },
    })

  // Clear optimistic state after mutation succeeds and refetch completes
  // Backend now waits for delivery before responding, so onSuccess means it succeeded
  useEffect(() => {
    if (optimisticFollowing === null) return
    // Don't clear during mutation
    if (followLoading || unfollowLoading) return

    // Wait for refetch to complete (refetch happens after 500ms in onSuccess)
    if (mutationSuccessTimeRef.current) {
      const timeSinceSuccess = Date.now() - mutationSuccessTimeRef.current
      if (timeSinceSuccess < 1000) return // Wait for refetch to complete
    } else if (!mutationJustCompletedRef.current) {
      return // No mutation completed
    }

    // Backend guarantees success if onSuccess fired, so just clear optimistic state
    // The refetched query data will now reflect the actual state
    mutationJustCompletedRef.current = false
    mutationSuccessTimeRef.current = null
    requestAnimationFrame(() => setOptimisticFollowing(null))
  }, [
    currentUserFollowing,
    targetProfileId,
    optimisticFollowing,
    followLoading,
    unfollowLoading,
  ])

  const isFollowing =
    optimisticFollowing !== null
      ? optimisticFollowing
      : currentUserFollowing?.orderedItems?.includes(targetProfileId) ?? false

  const hasOptimisticState = optimisticFollowing !== null

  return {
    isFollowing,
    followLoading,
    unfollowLoading,
    follow,
    unfollow,
    setOptimisticFollowing,
    hasOptimisticState,
  }
}

