import type { ReactNode } from 'react'
import { Box, useMediaQuery, useTheme } from '@mui/material'
import { LeftSidebar } from './LeftSidebar'
import { RightSidebar } from './RightSidebar'
import { MobileBottomNav } from './MobileBottomNav'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'))
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))

  return (
    <Box
      sx={{
        display: 'flex',
        maxWidth: { xs: '100%', lg: 1265 },
        margin: '0 auto',
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      {!isMobile && (
        <Box
          sx={{
            width: { xs: 0, sm: isTablet ? 240 : 68, lg: 240 },
            borderRight: '1px solid',
            borderColor: 'rgba(0, 0, 0, 0.08)',
            position: { sm: 'fixed', lg: 'sticky' },
            top: 0,
            height: '100vh',
            overflowY: 'auto',
            zIndex: 100,
            display: { xs: 'none', sm: 'block' },
          }}
        >
          <LeftSidebar isCompact={false} showSearchInSidebar={isTablet} />
        </Box>
      )}

      {isTablet && !isMobile && <Box sx={{ width: 240, flexShrink: 0 }} />}

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          width: { xs: '100%', lg: 'auto' },
          borderRight: {
            xs: 'none',
            lg: '1px solid',
          },
          borderColor: {
            xs: 'transparent',
            lg: 'rgba(0, 0, 0, 0.08)',
          },
        }}
      >
        {children}
      </Box>

      {isDesktop && (
        <Box
          sx={{
            width: { lg: 300 },
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflowY: 'auto',
            display: { xs: 'none', lg: 'block' },
          }}
        >
          <RightSidebar />
        </Box>
      )}

      {isMobile && <MobileBottomNav />}
      {isMobile && <Box sx={{ height: 56 }} />}
    </Box>
  )
}
