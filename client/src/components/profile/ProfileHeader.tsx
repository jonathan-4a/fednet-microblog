import { useState, lazy, Suspense } from 'react'
import { Box } from '@mui/material'
import type { Actor, OrderedCollection } from '../../types/activitypub'
import { DialogLoadingFallback } from '../LoadingFallback'
import { FollowButton } from './FollowButton'
import { ProfileInfo } from './ProfileInfo'
import { ProfileActions } from './ProfileActions'
import { useProfileFollow } from '../../hooks/useProfileFollow'

const UnfollowDialog = lazy(() =>
  import('../UnfollowDialog').then((module) => ({
    default: module.UnfollowDialog,
  }))
)

const FOLLOWING_BUTTON_WIDTH = 110

interface ProfileHeaderProps {
  profile: Actor
  isOwnProfile: boolean
  currentUser: { username: string | null } | null
  currentUserFollowing: OrderedCollection | null
  onEditClick: () => void
  onInviteClick?: () => void
  onDeleteAccountClick?: () => void
  onError?: (message: string) => void
}

export function ProfileHeader({
  profile,
  isOwnProfile,
  currentUser,
  currentUserFollowing,
  onEditClick,
  onInviteClick,
  onDeleteAccountClick,
  onError,
}: ProfileHeaderProps) {
  const [unfollowDialogOpen, setUnfollowDialogOpen] = useState(false)

  const {
    isFollowing,
    followLoading,
    unfollowLoading,
    follow,
    unfollow,
    setOptimisticFollowing,
    hasOptimisticState,
  } = useProfileFollow({
    currentUser,
    targetProfileId: profile.id,
    currentUserFollowing,
    onError: (error) => onError?.(error),
  })

  const handleFollowClick = async () => {
    if (!currentUser) return

    if (isFollowing) {
      // Open unfollow dialog
      setUnfollowDialogOpen(true)
      return
    }

    try {
      setOptimisticFollowing(true)
      await follow({
        targetActorUrl: profile.id,
        targetUsername: profile.preferredUsername,
        targetFollowersUrl: profile.followers,
      })
    } catch {
      // handled by hook onError
    }
  }

  const handleUnfollowConfirm = async () => {
    setUnfollowDialogOpen(false)
    try {
      setOptimisticFollowing(false)
      await unfollow({
        targetActorUrl: profile.id,
        targetUsername: profile.preferredUsername,
        targetFollowersUrl: profile.followers,
      })
    } catch {
      // handled by hook onError
    }
  }

  return (
    <Box>
      <Box
        sx={{
          height: { xs: 150, sm: 200 },
          backgroundColor: 'rgba(0,0,0,0.03)',
          borderBottom: '1px solid',
          borderColor: 'rgba(0,0,0,0.08)',
        }}
      />

      <Box sx={{ position: 'relative', px: { xs: 2, sm: 4 }, pt: 1, pb: 3 }}>
        <ProfileInfo profile={profile} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            mb: 2,
            mt: { xs: 4, sm: 1 },
            gap: 1,
          }}
        >
          {isOwnProfile ? (
            <ProfileActions
              onEditClick={onEditClick}
              onInviteClick={onInviteClick}
              onDeleteAccountClick={onDeleteAccountClick}
            />
          ) : (
            <FollowButton
              isFollowing={isFollowing}
              disabled={!hasOptimisticState && (followLoading || unfollowLoading)}
              width={FOLLOWING_BUTTON_WIDTH}
              height={45}
              onClick={handleFollowClick}
            />
          )}
        </Box>
      </Box>

      {unfollowDialogOpen && (
        <Suspense fallback={<DialogLoadingFallback />}>
          <UnfollowDialog
            open={unfollowDialogOpen}
            onClose={() => setUnfollowDialogOpen(false)}
            onConfirm={handleUnfollowConfirm}
            username={profile.preferredUsername}
            loading={unfollowLoading}
          />
        </Suspense>
      )}
    </Box>
  )
}

