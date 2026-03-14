// src/components/layout/LeftSidebar.tsx
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Badge,
  Button,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import PersonIcon from '@mui/icons-material/Person'
import SearchIcon from '@mui/icons-material/Search'
import NotificationsIcon from '@mui/icons-material/Notifications'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import LogoutIcon from '@mui/icons-material/Logout'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import EditIcon from '@mui/icons-material/Edit'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../hooks/useAuthContext'
import { useAuth } from '../../hooks/useAuth'
import { useState } from 'react'
import { CreatePostDialog } from '../CreatePostDialog'
import { UserSearch } from '../UserSearch'
import { useNotificationsQuery } from '../../hooks/queries/useNotificationsQuery'
import { COLORS } from '../../constants/theme'

interface LeftSidebarProps {
  isCompact?: boolean
  showSearchInSidebar?: boolean
}

export function LeftSidebar({ isCompact = false, showSearchInSidebar = false }: LeftSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAuthContext()
  const { logout } = useAuth()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [postDialogOpen, setPostDialogOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    handleClose()
    await logout()
  }

  const { data: notificationsData } = useNotificationsQuery(
    { limit: 1, offset: 0 },
    { enabled: !!(isAuthenticated && user) }
  )
  const notificationUnreadCount = notificationsData?.unreadCount ?? 0

  const menuItems: Array<{ icon: React.ReactNode; label: string; path?: string; onClick?: () => void; showBadge?: boolean }> = [
    { icon: <HomeIcon />, label: 'Home', path: '/' },
    ...(showSearchInSidebar && isAuthenticated
      ? [{ icon: <SearchIcon />, label: 'Search', onClick: () => setSearchOpen(true) }]
      : []),
    {
      icon: <PersonIcon />,
      label: 'Profile',
      path: user ? `/profile/${user.username}` : '/login',
    },
    ...(isAuthenticated && user
      ? [
          {
            icon: <NotificationsIcon />,
            label: 'Notifications',
            path: '/notifications' as const,
            showBadge: true,
          },
        ]
      : []),
    ...(user?.isAdmin
      ? [{ icon: <AdminPanelSettingsIcon />, label: 'Admin', path: '/admin' as const }]
      : []),
  ]

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: isCompact ? 1 : 2 }}>
        {!isCompact && (
          <>
            <Button
              variant='contained'
              fullWidth
              sx={{
                borderRadius: 25,
                textTransform: 'none',
                fontWeight: 700,
                py: 1.5,
                mb: 2,
              }}
              onClick={() => navigate('/register')}
            >
              Get Started
            </Button>
            <Button
              variant='outlined'
              fullWidth
              sx={{
                borderRadius: 25,
                textTransform: 'none',
                fontWeight: 700,
                py: 1.5,
              }}
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </>
        )}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        p: isCompact ? 1 : 2,
        position: 'relative',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <List sx={{ p: 0, flex: 1 }}>
        {menuItems.map((item) => {
          const isSelected =
            item.path !== undefined &&
            (item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path))
          const icon =
            'showBadge' in item && item.showBadge && notificationUnreadCount > 0 ? (
              <Badge badgeContent={notificationUnreadCount} sx={{ '& .MuiBadge-badge': { backgroundColor: COLORS.danger, color: COLORS.white } }}>
                {item.icon}
              </Badge>
            ) : (
              item.icon
            )
          const buttonContent = (
            <ListItemButton
              onClick={() => (item.onClick ? item.onClick() : item.path && navigate(item.path))}
              selected={isSelected}
              sx={{
                borderRadius: 3,
                py: 1.5,
                px: isCompact ? 1.5 : 3,
                justifyContent: isCompact ? 'center' : 'flex-start',
                backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                '&:hover': {
                  backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.03)',
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.12)',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: isCompact ? 0 : 40,
                  color: 'inherit',
                  justifyContent: 'center',
                }}
              >
                {icon}
              </ListItemIcon>
              {!isCompact && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 20,
                    fontWeight: 500,
                  }}
                />
              )}
            </ListItemButton>
          )

          return (
            <ListItem key={item.path ?? item.label} disablePadding sx={{ mb: 0.5 }}>
              {isCompact ? (
                <Tooltip title={item.label} placement='right'>
                  {buttonContent}
                </Tooltip>
              ) : (
                buttonContent
              )}
            </ListItem>
          )
        })}
      </List>
      {user && (
        <>
          {!isCompact && (
            <Button
              variant='contained'
              fullWidth
              onClick={() => setPostDialogOpen(true)}
              sx={{
                borderRadius: 25,
                textTransform: 'none',
                fontWeight: 700,
                py: 1.5,
                mb: 2,
                color: '#fff',
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              Post
            </Button>
          )}
          {isCompact && (
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant='contained'
                onClick={() => setPostDialogOpen(true)}
                sx={{
                  borderRadius: '50%',
                  minWidth: 50,
                  width: 50,
                  height: 50,
                  color: '#fff',
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
              >
                <EditIcon />
              </Button>
            </Box>
          )}
          <Box
            sx={{
              mt: 'auto',
              mb: 2,
              p: isCompact ? 1 : 1.5,
              borderRadius: 3,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.03)',
              },
            }}
            onClick={handleClick}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: isCompact ? 0 : 1.5,
                justifyContent: isCompact ? 'center' : 'flex-start',
              }}
            >
              <Avatar
                sx={{ width: isCompact ? 32 : 40, height: isCompact ? 32 : 40 }}
              >
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              {!isCompact && (
                <>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        fontSize: 15,
                        fontWeight: 700,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.displayName || user.username}
                    </Box>
                    <Box
                      sx={{
                        fontSize: 15,
                        color: 'text.secondary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      @{user.username}
                    </Box>
                  </Box>
                  <MoreHorizIcon
                    sx={{ color: 'text.secondary', fontSize: 20 }}
                  />
                </>
              )}
            </Box>
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            sx={{
              '& .MuiPaper-root': {
                borderRadius: 2,
                minWidth: 200,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              },
            }}
          >
            <MenuItem
              onClick={() => {
                handleClose()
                navigate(`/profile/${user.username}`)
              }}
            >
              <PersonIcon sx={{ mr: 1.5, fontSize: 20 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />
              Log out
            </MenuItem>
          </Menu>
        </>
      )}
      <CreatePostDialog
        open={postDialogOpen}
        onClose={() => setPostDialogOpen(false)}
      />
      {searchOpen && <UserSearch variant='modal' onClose={() => setSearchOpen(false)} />}
    </Box>
  )
}

