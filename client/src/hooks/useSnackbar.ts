import { useState } from 'react'

export type SnackbarSeverity = 'success' | 'error'

interface SnackbarState {
  open: boolean
  message: string
  severity: SnackbarSeverity
}

export function useSnackbar() {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  const showSnackbar = (
    message: string,
    severity: SnackbarSeverity = 'success'
  ) => {
    setSnackbar({
      open: true,
      message,
      severity,
    })
  }

  const showError = (message: string) => {
    showSnackbar(message, 'error')
  }

  const showSuccess = (message: string) => {
    showSnackbar(message, 'success')
  }

  const closeSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  return {
    snackbar,
    showSnackbar,
    showError,
    showSuccess,
    closeSnackbar,
  }
}

