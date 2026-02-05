import { Dialog, DialogContent, Button, Typography, Box } from '@mui/material'

interface UnfollowDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  username: string
  loading?: boolean
}

export function UnfollowDialog({
  open,
  onClose,
  onConfirm,
  username,
  loading = false,
}: UnfollowDialogProps) {
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
          Unfollow @{username}?
        </Typography>

        <Typography
          sx={{ fontSize: 15, lineHeight: 1.5, mb: 3 }}
          color='text.secondary'
        >
          Their posts will no longer show up in your timeline. You can still
          view their profile.
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
              cursor: 'pointer',
              py: 1.5,
            }}
          >
            Unfollow
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

