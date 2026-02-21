import { Box, Typography } from '@mui/material'
import { TwitterLayout } from '../components/layout/TwitterLayout'

export function HomePage() {
  return (
    <TwitterLayout>
      <Box
        sx={{
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          p: 2,
          position: 'sticky',
          top: 0,
          backgroundColor: 'background.paper',
          backdropFilter: 'blur(12px)',
          zIndex: 10,
        }}
      >
        <Typography sx={{ fontSize: 20, fontWeight: 700 }}>Home</Typography>
      </Box>

      <Box sx={{ p: 3 }}>
        <Typography color='text.secondary'>
          Your feed will appear here
        </Typography>
      </Box>
    </TwitterLayout>
  )
}

