// src/components/EmptyState.tsx
import { Box, Typography } from '@mui/material'

interface EmptyStateProps {
  message: string
  padding?: number | string | { px?: number; py?: number }
}

/**
 * Reusable empty state component
 * Used when lists or content areas are empty
 */
export function EmptyState({
  message,
  padding = { px: 4, py: 3 },
}: EmptyStateProps) {
  return (
    <Box sx={{ ...(typeof padding === 'object' ? padding : { p: padding }) }}>
      <Typography variant='body1' color='text.secondary'>
        {message}
      </Typography>
    </Box>
  )
}

