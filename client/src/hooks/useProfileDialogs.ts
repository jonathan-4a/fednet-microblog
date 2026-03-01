// src/hooks/useProfileDialogs.ts
import { useState } from 'react'

export function useProfileDialogs() {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [unfollowDialogOpen, setUnfollowDialogOpen] = useState(false)
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false)

  const openEditDialog = () => setEditDialogOpen(true)
  const closeEditDialog = () => setEditDialogOpen(false)

  const openInviteDialog = () => setInviteDialogOpen(true)
  const closeInviteDialog = () => setInviteDialogOpen(false)

  const openUnfollowDialog = () => setUnfollowDialogOpen(true)
  const closeUnfollowDialog = () => setUnfollowDialogOpen(false)

  const openDeleteAccountDialog = () => setDeleteAccountDialogOpen(true)
  const closeDeleteAccountDialog = () => setDeleteAccountDialogOpen(false)

  return {
    editDialog: {
      open: editDialogOpen,
      openDialog: openEditDialog,
      closeDialog: closeEditDialog,
    },
    inviteDialog: {
      open: inviteDialogOpen,
      openDialog: openInviteDialog,
      closeDialog: closeInviteDialog,
    },
    unfollowDialog: {
      open: unfollowDialogOpen,
      openDialog: openUnfollowDialog,
      closeDialog: closeUnfollowDialog,
    },
    deleteAccountDialog: {
      open: deleteAccountDialogOpen,
      openDialog: openDeleteAccountDialog,
      closeDialog: closeDeleteAccountDialog,
    },
  }
}

