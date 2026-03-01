// src/components/profile/ProfileActions.tsx
import { useState } from 'react'
import { Button, IconButton, Menu, MenuItem } from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

interface ProfileActionsProps {
  onEditClick: () => void
  onInviteClick?: () => void
  onDeleteAccountClick?: () => void
}

export function ProfileActions({
  onEditClick,
  onInviteClick,
  onDeleteAccountClick,
}: ProfileActionsProps) {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const menuOpen = Boolean(menuAnchorEl)

  const handleMenuClick = (e: React.MouseEvent<HTMLElement>) =>
    setMenuAnchorEl(e.currentTarget)
  const handleMenuClose = () => setMenuAnchorEl(null)
  const handleDeleteAccountClick = () => {
    handleMenuClose()
    onDeleteAccountClick?.()
  }

  return (
    <>
      <Button
        variant='outlined'
        onClick={onEditClick}
        sx={{
          borderRadius: 25,
          textTransform: 'none',
          fontWeight: 700,
          px: 3,
          color: 'primary.main',
          borderColor: 'primary.main',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'rgba(0,0,0,0.03)',
          },
        }}
      >
        Edit Profile
      </Button>
      {onInviteClick && (
        <Button
          variant='outlined'
          onClick={onInviteClick}
          sx={{
            borderRadius: 25,
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            color: 'primary.main',
            borderColor: 'primary.main',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'rgba(0,0,0,0.03)',
            },
          }}
        >
          Invite
        </Button>
      )}
      <IconButton
        onClick={handleMenuClick}
        sx={{
          color: 'text.primary',
          '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' },
        }}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 2,
            minWidth: 200,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          },
        }}
      >
        <MenuItem
          onClick={handleDeleteAccountClick}
          sx={{
            color: '#f4212e',
            '&:hover': { backgroundColor: 'rgba(244,33,46,0.08)' },
          }}
        >
          <DeleteOutlineIcon sx={{ mr: 1.5, fontSize: 20 }} />
          Delete account
        </MenuItem>
      </Menu>
    </>
  )
}


