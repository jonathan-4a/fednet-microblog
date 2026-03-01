// src/components/ErrorDisplay.tsx
import { Box, Typography } from '@mui/material'

interface ErrorDisplayProps {
  message: string
  padding?: number | string
}

/**
 * Reusable error display component
 * Used for consistent error message presentation
 */
export function ErrorDisplay({ message, padding = 4 }: ErrorDisplayProps) {
  return (
    <Box p={padding}>
      <Typography color='error'>{message}</Typography>
    </Box>
  )
}

