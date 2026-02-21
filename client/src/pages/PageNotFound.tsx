import { Box, Typography, Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export function NotFoundPage(): React.ReactElement {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 2,
        backgroundColor: 'background.default',
      }}
    >
      <Typography
        sx={{
          fontSize: 72,
          fontWeight: 700,
          color: 'text.primary',
        }}
      >
        404
      </Typography>

      <Typography
        sx={{
          fontSize: 15,
          color: 'text.secondary',
          mb: 2,
        }}
      >
        Page not found
      </Typography>

      <Button
        component={RouterLink}
        to='/'
        variant='contained'
        sx={{
          px: 4,
          borderRadius: 3,
          color: '#fff',
        }}
      >
        Go home
      </Button>
    </Box>
  )
}

