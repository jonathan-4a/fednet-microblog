import { Box, Paper, Typography } from '@mui/material'
import type { AdminUserSummary } from '../../types/admin'

interface RecentActivityProps {
  users: AdminUserSummary[]
}

export function RecentActivity({ users }: RecentActivityProps) {
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant='h6' gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
        Recent Activity
      </Typography>
      <Paper
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.08)',
          boxShadow: 'none',
          borderRadius: 2,
        }}
      >
        {users.length === 0 ? (
          <Typography variant='body2' color='text.secondary' sx={{ py: 2 }}>
            No recent activity
          </Typography>
        ) : (
          users.map((user) => (
            <Box
              key={user.username}
              sx={{
                py: 2,
                px: 1,
                borderBottom: '1px solid',
                borderColor: 'rgba(0, 0, 0, 0.08)',
                '&:last-child': {
                  borderBottom: 'none',
                },
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 1,
                },
                transition: 'background-color 0.2s',
              }}
            >
              <Typography variant='body1' sx={{ fontWeight: 600, mb: 0.5 }}>
                {user.username}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {user.address}
              </Typography>
            </Box>
          ))
        )}
      </Paper>
    </Box>
  )
}


