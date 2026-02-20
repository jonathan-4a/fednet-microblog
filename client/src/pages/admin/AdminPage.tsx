import { useMemo, lazy, Suspense } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Container,
  Button,
  IconButton,
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import { LoadingFallback } from '../../components/LoadingFallback'
import { useAuth } from '../../hooks/useAuth'
import { TabPanel } from '../../components/profile/TabPanel'
import { RGBA_COLORS } from '../../constants/theme'

const DashboardPage = lazy(() =>
  import('./DashboardPage').then((module) => ({
    default: module.DashboardPage,
  }))
)
const UsersPage = lazy(() =>
  import('./UsersPage').then((module) => ({ default: module.UsersPage }))
)
const PostsPage = lazy(() =>
  import('./PostsPage').then((module) => ({ default: module.PostsPage }))
)
const SettingsPage = lazy(() =>
  import('./SettingsPage').then((module) => ({ default: module.SettingsPage }))
)
const InvitesPage = lazy(() =>
  import('./InvitesPage').then((module) => ({ default: module.InvitesPage }))
)

export function AdminPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const value = useMemo(() => {
    if (location.pathname.includes('/admin/users')) return 1
    if (location.pathname.includes('/admin/posts')) return 2
    if (location.pathname.includes('/admin/settings')) return 3
    if (location.pathname.includes('/admin/invites')) return 4
    return 0
  }, [location.pathname])

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    const paths = [
      '/admin',
      '/admin/users',
      '/admin/posts',
      '/admin/settings',
      '/admin/invites',
    ]
    navigate(paths[newValue])
  }

  const handleLogout = async () => {
    await logout()
  }

  const handleHomeClick = () => {
    navigate('/')
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.08)',
          position: 'sticky',
          top: 0,
          backgroundColor: 'background.paper',
          backdropFilter: 'blur(12px)',
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton
            onClick={handleHomeClick}
            sx={{
              color: 'text.primary',
              '&:hover': {
                backgroundColor: RGBA_COLORS.lightHover,
              },
            }}
            aria-label='Go to home'
          >
            <HomeIcon />
          </IconButton>
          <Typography
            sx={{
              fontSize: 20,
              fontWeight: 700,
              color: 'text.primary',
            }}
          >
            Admin Panel
          </Typography>
        </Box>
        <Button
          onClick={handleLogout}
          variant='outlined'
          sx={{
            borderRadius: 25,
            textTransform: 'none',
            fontWeight: 700,
            px: 2.5,
            py: 1,
            color: 'primary.main',
            borderColor: 'primary.main',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: RGBA_COLORS.lightHover,
            },
          }}
        >
          Logout
        </Button>
      </Box>

      {/* Tabs */}
      <Box
        sx={{
          position: 'sticky',
          top: 57,
          zIndex: 9,
          backgroundColor: '#fff',
          borderBottom: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.08)',
        }}
      >
        <Container maxWidth='lg'>
          <Tabs
            value={value}
            onChange={handleChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                minHeight: 53,
                fontSize: '1rem',
                px: 3,
                '&:hover': {
                  backgroundColor: RGBA_COLORS.primaryTabHover,
                  transition: 'background-color 0.2s ease',
                },
              },
            }}
          >
            <Tab label='Dashboard' disableRipple />
            <Tab label='Users' disableRipple />
            <Tab label='Posts' disableRipple />
            <Tab label='Settings' disableRipple />
            <Tab label='Invites' disableRipple />
          </Tabs>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth='lg' sx={{ mt: 4, px: { xs: 2, sm: 3 }, pb: 4 }}>
        <TabPanel value={value} index={0}>
          <Suspense fallback={<LoadingFallback />}>
            <DashboardPage />
          </Suspense>
        </TabPanel>
        <TabPanel value={value} index={1}>
          <Suspense fallback={<LoadingFallback />}>
            <UsersPage />
          </Suspense>
        </TabPanel>
        <TabPanel value={value} index={2}>
          <Suspense fallback={<LoadingFallback />}>
            <PostsPage />
          </Suspense>
        </TabPanel>
        <TabPanel value={value} index={3}>
          <Suspense fallback={<LoadingFallback />}>
            <SettingsPage />
          </Suspense>
        </TabPanel>
        <TabPanel value={value} index={4}>
          <Suspense fallback={<LoadingFallback />}>
            <InvitesPage />
          </Suspense>
        </TabPanel>
      </Container>
    </Box>
  )
}


