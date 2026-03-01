// src/components/admin/RevokeInviteDialog.tsx
import {
  Dialog,
  DialogContent,
  Button,
  Typography,
  Box,
} from '@mui/material'

interface RevokeInviteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  token: string
  loading?: boolean
}

export function RevokeInviteDialog({
  open,
  onClose,
  onConfirm,
  token,
  loading = false,
}: RevokeInviteDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='xs'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
        },
      }}
    >
      <DialogContent sx={{ p: 4 }}>
        <Typography
          variant='h6'
          sx={{
            fontWeight: 700,
            mb: 2,
            fontSize: 20,
          }}
        >
          Revoke invite token?
        </Typography>
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{
            fontSize: 15,
            lineHeight: 1.5,
            mb: 3,
          }}
        >
          This invite token will be revoked and can no longer be used for
          registration. This action cannot be undone.
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography
            variant='body2'
            sx={{
              fontFamily: 'monospace',
              fontSize: 12,
              color: 'text.secondary',
              wordBreak: 'break-all',
            }}
          >
            {token}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            onClick={onConfirm}
            variant='contained'
            fullWidth
            sx={{
              borderRadius: 25,
              textTransform: 'none',
              fontWeight: 700,
              py: 1.5,
              color: '#fff',
              backgroundColor: '#f4212e',
              '&:hover': {
                backgroundColor: '#d91e2b',
              },
            }}
            disabled={loading}
          >
            Revoke
          </Button>
          <Button
            onClick={onClose}
            variant='outlined'
            fullWidth
            sx={{
              borderRadius: 25,
              textTransform: 'none',
              fontWeight: 700,
              py: 1.5,
              color: 'primary.main',
              borderColor: 'primary.main',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'rgba(0, 0, 0, 0.03)',
              },
            }}
            disabled={loading}
          >
            Cancel
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}


