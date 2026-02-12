import { Suspense, lazy } from 'react'
import { DialogLoadingFallback } from '../LoadingFallback'
import { ReplyDialog } from '../ReplyDialog'
import { RepostDialog } from '../RepostDialog'
import { EditPostDialog } from '../EditPostDialog'
import { DeletePostDialog } from '../DeletePostDialog'
import { useUpdatePostMutation } from '../../hooks/mutations/useUpdatePostMutation'
import { useDeletePostMutation } from '../../hooks/mutations/useDeletePostMutation'
import { useSnackbar } from '../../hooks/useSnackbar'
import type { UserProfileOutput } from '../../types/user'
import type { Post } from '../../types/posts'

const EditProfileDialog = lazy(() =>
  import('../EditProfileDialog').then((module) => ({
    default: module.EditProfileDialog,
  }))
)
const InviteDialog = lazy(() =>
  import('../InviteDialog').then((module) => ({
    default: module.InviteDialog,
  }))
)

const DeleteAccountDialog = lazy(() =>
  import('../DeleteAccountDialog').then((module) => ({
    default: module.DeleteAccountDialog,
  }))
)

export interface ProfileDialogsProps {
  // Profile dialogs
  isOwnProfile: boolean
  currentUserProfile: UserProfileOutput | null
  currentUser: { username: string | null } | null

  editDialogOpen: boolean
  inviteDialogOpen: boolean

  deleteAccountDialogOpen: boolean
  onEditDialogClose: () => void
  onInviteDialogClose: () => void

  onDeleteAccountDialogClose: () => void
  onProfileUpdate: () => Promise<void>

  onDeleteAccountConfirm: () => Promise<void>

  deleteAccountLoading: boolean

  // Post dialogs
  replyDialogOpen: boolean
  replyPost: Post | null
  onReplyDialogClose: () => void
  onReplySuccess?: () => void

  repostDialogOpen: boolean
  repostPost: Post | null
  onRepostDialogClose: () => void
  onRepostSuccess?: () => void

  // Edit/Delete post dialogs
  editPost: Post | null
  deletePost: Post | null
  onEditPostClose: () => void
  onDeletePostClose: () => void
}

export interface ProfileDialogsHandle {
  setEditPost: (post: Post | null) => void
  setDeletePost: (post: Post | null) => void
}

export function ProfileDialogs({
  // Profile dialogs
  isOwnProfile,
  currentUserProfile,
  currentUser,

  editDialogOpen,
  inviteDialogOpen,

  deleteAccountDialogOpen,
  onEditDialogClose,
  onInviteDialogClose,

  onDeleteAccountDialogClose,
  onProfileUpdate,

  onDeleteAccountConfirm,

  deleteAccountLoading,

  // Post dialogs
  replyDialogOpen,
  replyPost,
  onReplyDialogClose,
  onReplySuccess,

  repostDialogOpen,
  repostPost,
  onRepostDialogClose,
  onRepostSuccess,

  // Edit/Delete post dialogs
  editPost,
  deletePost,
  onEditPostClose,
  onDeletePostClose,
}: ProfileDialogsProps) {
  const { showError } = useSnackbar()

  const { mutateAsync: updatePostMutation } = useUpdatePostMutation({
    onSuccess: () => {
      onEditPostClose()
      onReplySuccess?.()
    },
    onError: (error) => showError(error.message || 'Failed to update post'),
  })

  const { mutateAsync: deletePostMutation, isPending: deletePostLoading } =
    useDeletePostMutation({
      onSuccess: () => {
        onDeletePostClose()
        onReplySuccess?.()
      },
      onError: (error) => showError(error.message || 'Failed to delete post'),
    })

  const handleEditSubmit = async (guid: string, content: string) => {
    if (!editPost) return
    await updatePostMutation({
      guid,
      data: { content },
      author_username: editPost.author_username,
      noteId: editPost.noteId,
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deletePost) return
    try {
      await deletePostMutation({
        guid: deletePost.guid,
        author_username: deletePost.author_username,
        noteId: deletePost.noteId,
      })
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <>
      {/* Edit Post Dialog */}
      {editPost && (
        <EditPostDialog
          open={true}
          onClose={onEditPostClose}
          post={editPost}
          onSubmit={handleEditSubmit}
          onSuccess={onEditPostClose}
        />
      )}

      {/* Delete Post Dialog */}
      {deletePost && (
        <DeletePostDialog
          open={true}
          onClose={onDeletePostClose}
          post={deletePost}
          loading={deletePostLoading}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/* Profile Dialogs - Only render if own profile */}
      {isOwnProfile && currentUserProfile && (
        <>
          {editDialogOpen && (
            <Suspense fallback={<DialogLoadingFallback />}>
              <EditProfileDialog
                open={editDialogOpen}
                onClose={onEditDialogClose}
                profile={currentUserProfile}
                onUpdate={onProfileUpdate}
              />
            </Suspense>
          )}
          {inviteDialogOpen && (
            <Suspense fallback={<DialogLoadingFallback />}>
              <InviteDialog
                open={inviteDialogOpen}
                onClose={onInviteDialogClose}
              />
            </Suspense>
          )}
        </>
      )}

      {/* Delete Account Dialog - Only render if own profile */}
      {isOwnProfile && currentUser && deleteAccountDialogOpen && (
        <Suspense fallback={<DialogLoadingFallback />}>
          <DeleteAccountDialog
            open={deleteAccountDialogOpen}
            onClose={onDeleteAccountDialogClose}
            onConfirm={onDeleteAccountConfirm}
            username={currentUser.username || ''}
            loading={deleteAccountLoading}
          />
        </Suspense>
      )}

      {/* Reply Dialog - Always available */}
      <ReplyDialog
        open={replyDialogOpen}
        onClose={onReplyDialogClose}
        post={replyPost}
        onSuccess={onReplySuccess}
      />

      {/* Repost Dialog - Always available */}
      <RepostDialog
        open={repostDialogOpen}
        onClose={onRepostDialogClose}
        post={repostPost}
        onSuccess={onRepostSuccess}
      />
    </>
  )
}

