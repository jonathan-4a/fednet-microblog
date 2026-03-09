// src/components/layout/MobileBottomNav.tsx
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import PersonIcon from '@mui/icons-material/Person'
import SearchIcon from '@mui/icons-material/Search'
import NotificationsIcon from '@mui/icons-material/Notifications'
import MenuIcon from '@mui/icons-material/Menu'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import EditIcon from '@mui/icons-material/Edit'
import LogoutIcon from '@mui/icons-material/Logout'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../hooks/useAuthContext'
import { useAuth } from '../../hooks/useAuth'
import { useState } from 'react'
import { UserSearch } from '../UserSearch'
import { CreatePostDialog } from '../CreatePostDialog'
import { useNotificationsQuery } from '../../hooks/queries/useNotificationsQuery'
import { COLORS } from '../../constants/theme'

export function MobileBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAuthContext()
  const { logout } = useAuth()
  const [showSearch, setShowSearch] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [postDialogOpen, setPostDialogOpen] = useState(false)

  const { data: notificationsData } = useNotificationsQuery(
    { limit: 1, offset: 0 },
    { enabled: !!(isAuthenticated && user) }
  )
  const notificationUnreadCount = notificationsData?.unreadCount ?? 0

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0) {
      navigate('/')
    } else if (newValue === 1) {
      setShowSearch(true)
    } else if (newValue === 2 && user) {
      navigate('/notifications')
    } else if (newValue === 3) {
      setPostDialogOpen(true)
    } else if (newValue === 4) {
      setDrawerOpen(true)
    }
  }

  const handleCloseSearch = () => {
    setShowSearch(false)
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
  }

  const handleDrawerNav = (path: string) => {
    handleDrawerClose()
    navigate(path)
  }

  const handleLogout = async () => {
    handleDrawerClose()
    await logout()
  }

  if (!isAuthenticated) {
    return null
  }

  let currentValue = 0
  if (showSearch) {
    currentValue = 1
  } else if (location.pathname === '/notifications') {
    currentValue = 2
  } else if (postDialogOpen) {
    currentValue = 3
  } else if (drawerOpen) {
    currentValue = 4
  }

  return (
    <>
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          borderTop: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.08)',
        }}
        elevation={0}
      >
        <BottomNavigation
          value={currentValue}
          onChange={handleChange}
          showLabels={false}
          sx={{
            '& .MuiBottomNavigationAction-root': { minWidth: 0 },
            '& .MuiBottomNavigationAction-label': { display: 'none' },
          }}
        >
          <BottomNavigationAction label='Home' icon={<HomeIcon />} />
          <BottomNavigationAction label='Search' icon={<SearchIcon />} />
          <BottomNavigationAction
            label='Notifications'
            icon={
              <Badge
                badgeContent={notificationUnreadCount > 0 ? notificationUnreadCount : undefined}
                sx={{ '& .MuiBadge-badge': { backgroundColor: COLORS.twitterRed, color: COLORS.white } }}
              >
                <NotificationsIcon />
              </Badge>
            }
          />
          <BottomNavigationAction label='Post' icon={<EditIcon />} />
          <BottomNavigationAction label='More' icon={<MenuIcon />} />
        </BottomNavigation>
      </Paper>

      <Drawer
        anchor='left'
        open={drawerOpen}
        onClose={handleDrawerClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            pt: 2,
          },
        }}
      >
        <List sx={{ px: 1 }}>
          {user && (
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleDrawerNav(`/profile/${user.username}`)}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary='Profile' primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
          )}
          {user?.isAdmin && (
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleDrawerNav('/admin')}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <AdminPanelSettingsIcon />
                </ListItemIcon>
                <ListItemText primary='Admin' primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
          )}
        </List>
        <Divider sx={{ my: 1 }} />
        <List sx={{ px: 1 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary='Log out' primaryTypographyProps={{ fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {showSearch && <UserSearch variant='modal' onClose={handleCloseSearch} />}
      <CreatePostDialog open={postDialogOpen} onClose={() => setPostDialogOpen(false)} />
    </>
  )
}


