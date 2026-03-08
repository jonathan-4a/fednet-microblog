// src/pages/admin/DashboardPage.tsx
import { Box, Typography } from '@mui/material'
import { useDashboardQuery } from '../../hooks/queries/useAdminQueries'
import { StatsStrip } from '../../components/admin/StatsStrip'
import { RecentActivity } from '../../components/admin/RecentActivity'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ErrorDisplay } from '../../components/ErrorDisplay'

export function DashboardPage() {
  const { data, isLoading: loading, error } = useDashboardQuery()

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorDisplay message={error.message} />
  }

  if (!data) return null

  const statsItems = [
    { label: 'Total Users', value: data.stats.total_users },
    { label: 'Active Users', value: data.stats.active_users },
    { label: 'Inactive Users', value: data.stats.inactive_users },
    { label: 'Total Posts', value: data.stats.total_posts },
  ]

  return (
    <Box>
      <Typography
        sx={{
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'text.primary',
          mb: 2,
        }}
      >
        Overview
      </Typography>

      <StatsStrip items={statsItems} />

      <RecentActivity users={data.recent_activity.users} />
    </Box>
  )
}

