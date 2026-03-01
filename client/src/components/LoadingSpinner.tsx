// src/components/LoadingSpinner.tsx
import { Box, CircularProgress } from '@mui/material'

interface LoadingSpinnerProps {
  size?: number
  minHeight?: string | number
  padding?: number | string
}

/**
 * Reusable loading spinner component
 * Used throughout the app for consistent loading states
 */
export function LoadingSpinner({
  size,
  minHeight,
  padding = 4,
}: LoadingSpinnerProps) {
  return (
    <Box
      display='flex'
      justifyContent='center'
      alignItems='center'
      p={padding}
      minHeight={minHeight}
    >
      <CircularProgress size={size} />
    </Box>
  )
}

