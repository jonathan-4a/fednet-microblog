// src/components/layout/TwitterLayout.tsx
import type { ReactNode } from 'react'
import { Box, useMediaQuery, useTheme } from '@mui/material'
import { LeftSidebar } from './LeftSidebar'
import { RightSidebar } from './RightSidebar'
import { MobileBottomNav } from './MobileBottomNav'

interface TwitterLayoutProps {
  children: ReactNode
}

export function TwitterLayout({ children }: TwitterLayoutProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')) // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg')) // 600px - 1200px
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg')) // >= 1200px

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
      {/* Left Sidebar - Hidden on mobile */}
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
          <LeftSidebar isCompact={false} />
        </Box>
      )}

      {/* Spacer for fixed sidebar on tablet */}
      {isTablet && !isMobile && <Box sx={{ width: 240, flexShrink: 0 }} />}

      {/* Center Content */}
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

      {/* Right Sidebar - Only on desktop */}
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

      {/* Mobile Bottom Navigation - Only on mobile */}
      {isMobile && <MobileBottomNav />}

      {/* Spacer for mobile bottom nav */}
      {isMobile && <Box sx={{ height: 56 }} />}
    </Box>
  )
}

