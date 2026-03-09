// src/contexts/SnackbarContext.tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { SnackbarNotification } from '../components/SnackbarNotification'

export type SnackbarSeverity = 'success' | 'error'

interface SnackbarState {
  open: boolean
  message: string
  severity: SnackbarSeverity
}

interface SnackbarContextValue {
  snackbar: SnackbarState
  showSnackbar: (message: string, severity?: SnackbarSeverity) => void
  showError: (message: string) => void
  /** Logs error to console and shows it in snackbar (or "Operation failed" if empty). Use for remote/federation errors. */
  onRemoteError: (rawError?: string) => void
  showSuccess: (message: string) => void
  closeSnackbar: () => void
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null)

const REMOTE_ERROR_MESSAGE = 'Operation failed'

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  })

  const showSnackbar = useCallback(
    (message: string, severity: SnackbarSeverity = 'success') => {
      setSnackbar({ open: true, message, severity })
    },
    []
  )

  const showError = useCallback((message: string) => {
    console.error('[Snackbar]', message)
    setSnackbar({
      open: true,
      message,
      severity: 'error',
    })
  }, [])

  const onRemoteError = useCallback((rawError?: string) => {
    const message = rawError?.trim() || REMOTE_ERROR_MESSAGE
    console.error(message)
    setSnackbar({
      open: true,
      message,
      severity: 'error',
    })
  }, [])

  const showSuccess = useCallback((message: string) => {
    setSnackbar({ open: true, message, severity: 'success' })
  }, [])

  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }, [])

  const value: SnackbarContextValue = {
    snackbar,
    showSnackbar,
    showError,
    onRemoteError,
    showSuccess,
    closeSnackbar,
  }

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <SnackbarNotification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </SnackbarContext.Provider>
  )
}

export function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext)
  if (!ctx) throw new Error('useSnackbar must be used within SnackbarProvider')
  return ctx
}
