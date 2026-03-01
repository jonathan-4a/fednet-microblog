// src/components/layout/RightSidebar.tsx
import { Box } from '@mui/material'
import { useAuthContext } from '../../hooks/useAuthContext'
import { UserSearch } from '../UserSearch'

export function RightSidebar() {
  const { isAuthenticated } = useAuthContext()

  if (!isAuthenticated) {
    return null
  }

  return (
    <Box sx={{ p: 2 }}>
      <UserSearch variant='dropdown' />
    </Box>
  )
}

