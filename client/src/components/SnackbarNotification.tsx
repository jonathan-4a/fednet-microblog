import { Snackbar, Alert } from '@mui/material'
import type { SnackbarSeverity } from '../hooks/useSnackbar'

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
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  )
}

