// src/components/admin/RevokeInviteDialog.tsx
import { Dialog, DialogContent, Button, Typography, Box } from '@mui/material'
import { BORDER_RADIUS, COLORS, RGBA_COLORS } from '../../constants/theme'

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
          borderRadius: BORDER_RADIUS.card,
          border: '1px solid',
          borderColor: RGBA_COLORS.border,
          boxShadow: 'none',
        },
      }}
    >
      <DialogContent sx={{ p: 2.5 }}>
        <Typography sx={{ fontSize: 17, fontWeight: 600, mb: 1.5 }}>
          Revoke invite token?
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ fontSize: 13, lineHeight: 1.5, mb: 2 }}>
          This invite token will be revoked and can no longer be used for registration. This action cannot be undone.
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary', wordBreak: 'break-all' }}>
            {token}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            onClick={onConfirm}
            variant='contained'
            size='small'
            fullWidth
            sx={{
              borderRadius: BORDER_RADIUS.button,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 13,
              py: 1,
              color: '#fff',
              backgroundColor: COLORS.twitterRed,
              boxShadow: 'none',
              '&:hover': { backgroundColor: '#d91e2b', boxShadow: 'none' },
            }}
            disabled={loading}
          >
            Revoke
          </Button>
          <Button
            onClick={onClose}
            variant='outlined'
            size='small'
            fullWidth
            sx={{
              borderRadius: BORDER_RADIUS.button,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 13,
              py: 1,
              color: 'primary.main',
              borderColor: 'primary.main',
              '&:hover': { borderColor: 'primary.main', backgroundColor: RGBA_COLORS.lightHover },
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


