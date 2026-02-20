import { Box, Typography, Grid } from '@mui/material'
import { useDashboardQuery } from '../../hooks/queries/useAdminQueries'
import { StatCard } from '../../components/admin/StatCard'
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

  return (
    <Box>
      <Typography variant='h5' gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label='Total Users' value={data.stats.total_users} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label='Active Users' value={data.stats.active_users} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label='Inactive Users' value={data.stats.inactive_users} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label='Total Posts' value={data.stats.total_posts} />
        </Grid>
      </Grid>

      <RecentActivity users={data.recent_activity.users} />
    </Box>
  )
}

