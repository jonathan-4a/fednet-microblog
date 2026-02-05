import { Dialog, DialogContent, Button, Typography, Box } from '@mui/material'

interface DeleteAccountDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  username: string
  loading?: boolean
}

export function DeleteAccountDialog({
  open,
  onClose,
  onConfirm,
  username: _username,
  loading = false,
}: DeleteAccountDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='xs'
      fullWidth
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogContent sx={{ p: 4 }}>
        <Typography sx={{ fontWeight: 700, mb: 2, fontSize: 20 }}>
          Delete account?
        </Typography>

        <Typography
          sx={{ fontSize: 15, lineHeight: 1.5, mb: 3 }}
          color='text.secondary'
        >
          This action cannot be reverted. Your account and all associated data
          will be permanently deleted.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            onClick={onConfirm}
            variant='contained'
            fullWidth
            disabled={loading}
            sx={{
              borderRadius: 25,
              textTransform: 'none',
              fontWeight: 700,
              color: '#fff',
              backgroundColor: '#f4212e',
              cursor: 'pointer',
              py: 1.5,
              '&:hover': {
                backgroundColor: '#d91e28',
              },
            }}
          >
            Delete
          </Button>

          <Button
            onClick={onClose}
            variant='outlined'
            fullWidth
            disabled={loading}
            sx={{
              borderRadius: 25,
              textTransform: 'none',
              fontWeight: 700,
              py: 1.5,
            }}
          >
            Cancel
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

