// src/components/SnackbarNotification.tsx
import { Snackbar, Alert } from '@mui/material'
import type { SnackbarSeverity } from '../contexts/SnackbarContext'

interface SnackbarNotificationProps {
  open: boolean
  message: string
  severity: SnackbarSeverity
  onClose: () => void
  autoHideDuration?: number
}

/**
 * Reusable Snackbar notification component
 * Works with useSnackbar hook for consistent error/success messaging
 */
export function SnackbarNotification({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 6000,
}: SnackbarNotificationProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ zIndex: 9999 }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  )
}

