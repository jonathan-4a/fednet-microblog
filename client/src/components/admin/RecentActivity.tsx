// src/components/admin/RecentActivity.tsx
import { Box, Typography } from '@mui/material'
import type { AdminUserSummary } from '../../types/admin'
import { RGBA_COLORS } from '../../constants/theme'

interface RecentActivityProps {
  users: AdminUserSummary[]
}

export function RecentActivity({ users }: RecentActivityProps) {
  return (
    <Box sx={{ mt: 3 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 1.5 }}>
        Recent activity
      </Typography>
      {users.length === 0 ? (
        <Typography variant='body2' color='text.secondary' sx={{ py: 2.5, px: 2, fontSize: 13, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
          No recent activity
        </Typography>
      ) : (
        <Box sx={{ backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 2, overflow: 'hidden' }}>
          {users.map((user) => (
            <Box
              key={user.username}
              sx={{
                py: 1.5,
                px: 2,
                '&:hover': { backgroundColor: RGBA_COLORS.lightHover },
                transition: 'background-color 0.15s ease',
              }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                {user.username}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ fontSize: 12, mt: 0.25 }}>
                {user.address}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}


