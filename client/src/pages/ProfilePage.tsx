import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Box } from '@mui/material'

import { ProfileHeader } from '../components/profile/ProfileHeader'
import { TabPanel } from '../components/profile/TabPanel'
import { ProfileTabs } from '../components/profile/ProfileTabs'
import { PostsTab } from '../components/profile/PostsTab'
import { RepliesTab } from '../components/profile/RepliesTab'
import { RepostsTab } from '../components/profile/RepostsTab'
import { LikesTab } from '../components/profile/LikesTab'
import { ProfileDialogs } from '../components/profile/ProfileDialogs'
import { UserList } from '../components/profile/UserList'
import { SnackbarNotification } from '../components/SnackbarNotification'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorDisplay } from '../components/ErrorDisplay'
import { useAuthStore } from '../stores/authStore'
import { useUserPostsQuery } from '../hooks/queries/useUserPostsQuery'
import { useServerConfig } from '../hooks/queries/useConfigQuery'

import { useProfileDialogs } from '../hooks/useProfileDialogs'
import { useDeleteAccount } from '../hooks/useDeleteAccount'
import { useProfileDataQuery } from '../hooks/useProfileDataQuery'

import { useSnackbar } from '../hooks/useSnackbar'
import { usePostInteractions } from '../hooks/usePostInteractions'
import { TwitterLayout } from '../components/layout/TwitterLayout'
import type { Post } from '../types/posts'

export function ProfilePage() {
  const currentUser = useAuthStore((state) => state.user)
  const {
    profile,
    profileLoading,
    profileError,
    refetchProfile,
    followers,
    followersQuery,
    following,
    followingQuery,
    currentUserProfile,
    refetchCurrentUserProfile,
    currentUserFollowing,
    refetchCurrentUserFollowing,
    isRemote,
  } = useProfileDataQuery()

  const { username } = useParams<{ username?: string }>()
  const isOwnProfile = !isRemote && currentUser?.username === username
  const { isInviteOnly } = useServerConfig()

  const [tabValue, setTabValue] = useState(0)
  const [postTabValue, setPostTabValue] = useState(0)
  const [editPost, setEditPost] = useState<Post | null>(null)
  const [deletePost, setDeletePost] = useState<Post | null>(null)
  const dialogs = useProfileDialogs()
  const { deleteAccount: handleDeleteAccount, loading: deleteAccountLoading } =
    useDeleteAccount()
  const { snackbar, showError, closeSnackbar } = useSnackbar()

  const {
    handleReply,
    handleRepost,
    handleLike,
    replyPost,
    replyDialogOpen,
    closeReplyDialog,
    repostPost,
    repostDialogOpen,
    closeRepostDialog,
  } = usePostInteractions(currentUser?.username)

  const { data: postsData, isLoading: postsLoading, refetch: refetchPosts } = useUserPostsQuery(username, profile)

  const postsCount = postsLoading ? undefined : (postsData?.pages?.[0]?.totalItems ?? 0)

  // Reset to Posts tab (index 0) when username or profile changes
  useEffect(() => {
    setTabValue(0)
    setPostTabValue(0)
  }, [username, profile?.id, profile?.outbox])

  const handlePostEditDeleteSuccess = async () => {
    await refetchPosts()
  }

  const handleEdit = (post: Post) => {
    setEditPost(post)
  }

  const handleDelete = (post: Post) => {
    setDeletePost(post)
  }

  const handleProfileUpdate = async () => {
    try {
      await Promise.all([refetchCurrentUserProfile(), refetchProfile()])
    } catch {
      showError('Failed to refresh profile')
    }
  }

  const handleDeleteAccountConfirm = async () => {
    try {
      await handleDeleteAccount()
      dialogs.deleteAccountDialog.closeDialog()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete account')
    }
  }

  if (profileLoading) {
    return (
      <TwitterLayout>
        <LoadingSpinner />
      </TwitterLayout>
    )
  }

  if (profileError || !profile) {
    return (
      <TwitterLayout>
        <ErrorDisplay message={profileError || 'Profile not found'} />
      </TwitterLayout>
    )
  }

  return (
    <TwitterLayout>
      <Box>
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          currentUser={currentUser}
          currentUserFollowing={currentUserFollowing}
          onEditClick={dialogs.editDialog.openDialog}
          onInviteClick={
            isOwnProfile && isInviteOnly
              ? dialogs.inviteDialog.openDialog
              : undefined
          }
          onDeleteAccountClick={
            isOwnProfile ? dialogs.deleteAccountDialog.openDialog : undefined
          }
          onError={showError}
        />

        <ProfileTabs
          value={tabValue}
          onChange={setTabValue}
          followersCount={followers?.totalItems}
          followingCount={following?.totalItems}
          followersPrivate={!!(followers && '_collectionPrivate' in followers && followers._collectionPrivate)}
          followingPrivate={!!(following && '_collectionPrivate' in following && following._collectionPrivate)}
          postsCount={postsCount}
        />

        <TabPanel value={tabValue} index={0}>
          <Box
            sx={{
              display: 'flex',
              borderBottom: '1px solid #eee',
              marginBottom: '8px',
              gap: 0,
              pl: 2,
            }}
          >
            {[
              { label: 'Posts', index: 0 },
              { label: 'Reposts', index: 1 },
              { label: 'Replies', index: 2 },
              { label: 'Likes', index: 3 },
            ].map(({ label, index }) => (
              <Box
                key={label}
                component="button"
                type="button"
                onClick={() => setPostTabValue(index)}
                sx={{
                  display: 'inline-flex',
                  width: 'fit-content',
                  py: '14px',
                  px: 0,
                  mr: 3,
                  border: 'none',
                  borderBottom: '3px solid',
                  borderColor: postTabValue === index ? 'primary.main' : 'transparent',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: postTabValue === index ? 700 : 600,
                  color: postTabValue === index ? 'text.primary' : '#666',
                  letterSpacing: '-0.01em',
                  transition: 'color 180ms ease, border-color 180ms ease',
                  '&:hover': { color: '#111' },
                  '&:last-of-type': { mr: 0 },
                }}
              >
                {label}
              </Box>
            ))}
          </Box>

          <TabPanel value={postTabValue} index={0}>
            <PostsTab
              username={username}
              profile={profile}
              onReply={handleReply}
              onRepost={handleRepost}
              onLike={handleLike}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TabPanel>

          <TabPanel value={postTabValue} index={1}>
            <RepostsTab
              username={username}
              profile={profile}
              onReply={handleReply}
              onRepost={handleRepost}
              onLike={handleLike}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TabPanel>

          <TabPanel value={postTabValue} index={2}>
            <RepliesTab
              username={username}
              profile={profile}
              onReply={handleReply}
              onRepost={handleRepost}
              onLike={handleLike}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TabPanel>

          <TabPanel value={postTabValue} index={3}>
            <LikesTab
              profile={profile}
              username={username}
              onReply={handleReply}
              onRepost={handleRepost}
              onLike={handleLike}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TabPanel>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <UserList
            users={followers}
            currentUser={currentUser as { username: string | null }}
            currentUserFollowing={currentUserFollowing}
            refetchCurrentUserFollowing={async () => {
              await refetchCurrentUserFollowing()
            }}
            onError={showError}
            emptyMessage='No followers'
            hasNextPage={followersQuery?.hasNextPage}
            fetchNextPage={followersQuery?.fetchNextPage}
            isFetchingNextPage={followersQuery?.isFetchingNextPage}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <UserList
            users={following}
            currentUser={currentUser as { username: string | null }}
            currentUserFollowing={currentUserFollowing}
            refetchCurrentUserFollowing={async () => {
              await refetchCurrentUserFollowing()
            }}
            onError={showError}
            emptyMessage='Not following anyone'
            hasNextPage={followingQuery?.hasNextPage}
            fetchNextPage={followingQuery?.fetchNextPage}
            isFetchingNextPage={followingQuery?.isFetchingNextPage}
          />
        </TabPanel>
      </Box>

      <ProfileDialogs
        isOwnProfile={isOwnProfile}
        currentUserProfile={currentUserProfile}
        currentUser={currentUser}
        editDialogOpen={dialogs.editDialog.open}
        inviteDialogOpen={dialogs.inviteDialog.open}
        deleteAccountDialogOpen={dialogs.deleteAccountDialog.open}
        onEditDialogClose={dialogs.editDialog.closeDialog}
        onInviteDialogClose={dialogs.inviteDialog.closeDialog}
        onDeleteAccountDialogClose={dialogs.deleteAccountDialog.closeDialog}
        onProfileUpdate={handleProfileUpdate}
        onDeleteAccountConfirm={handleDeleteAccountConfirm}
        deleteAccountLoading={deleteAccountLoading}
        replyDialogOpen={replyDialogOpen}
        replyPost={replyPost}
        onReplyDialogClose={closeReplyDialog}
        onReplySuccess={handlePostEditDeleteSuccess}
        repostDialogOpen={repostDialogOpen}
        repostPost={repostPost}
        onRepostDialogClose={closeRepostDialog}
        onRepostSuccess={handlePostEditDeleteSuccess}
        editPost={editPost}
        deletePost={deletePost}
        onEditPostClose={() => setEditPost(null)}
        onDeletePostClose={() => setDeletePost(null)}
      />

      <SnackbarNotification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </TwitterLayout>
  )
}

