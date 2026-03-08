// src/pages/admin/AdminPage.tsx
import { useMemo, lazy, Suspense } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import { LoadingFallback } from '../../components/LoadingFallback'
import { TabPanel } from '../../components/profile/TabPanel'
import { TwitterLayout } from '../../components/layout/TwitterLayout'
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

const ADMIN_TABS = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Users', path: '/admin/users' },
  { label: 'Posts', path: '/admin/posts' },
  { label: 'Settings', path: '/admin/settings' },
  { label: 'Invites', path: '/admin/invites' },
] as const

export function AdminPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const value = useMemo(() => {
    const idx = ADMIN_TABS.findIndex((t) => location.pathname === t.path)
    return idx >= 0 ? idx : 0
  }, [location.pathname])

  return (
    <TwitterLayout>
      <Box>
        {/* Sticky bar: title + tabs (logout is in left sidebar) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'stretch',
            borderBottom: '1px solid',
            borderColor: RGBA_COLORS.border,
            position: 'sticky',
            top: 0,
            backgroundColor: 'background.paper',
            backdropFilter: 'blur(12px)',
            zIndex: 10,
            minHeight: 48,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              minWidth: 0,
              pl: 2,
              pr: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: 700,
                color: 'text.primary',
                mr: 5,
                flexShrink: 0,
              }}
            >
              Admin
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'stretch',
                flexWrap: 'wrap',
              }}
            >
              {ADMIN_TABS.map((tab, index) => {
                const selected = value === index
                return (
                  <Box
                    key={tab.path}
                    component='button'
                    type='button'
                    onClick={() => navigate(tab.path)}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      py: 1.75,
                      px: 0,
                      mr: 3.5,
                      border: 'none',
                      borderBottom: '2px solid',
                      borderBottomColor: selected ? 'primary.main' : 'transparent',
                      cursor: 'pointer',
                      background: 'transparent',
                      fontFamily: 'inherit',
                      fontSize: 14,
                      fontWeight: selected ? 700 : 600,
                      color: selected ? 'text.primary' : '#666',
                      letterSpacing: '-0.01em',
                      transition: 'color 180ms ease, border-color 180ms ease',
                      '&:hover': {
                        color: 'text.primary',
                      },
                      '&:focus': { outline: 'none' },
                      '&:focus-visible': { outline: 'none' },
                      '&:last-of-type': { mr: 0 },
                    }}
                  >
                    {tab.label}
                  </Box>
                )
              })}
            </Box>
          </Box>
        </Box>

        {/* Content - same padding as main app pages */}
        <Box sx={{ px: 2, py: 3, pb: 4 }}>
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
        </Box>
      </Box>
    </TwitterLayout>
  )
}


