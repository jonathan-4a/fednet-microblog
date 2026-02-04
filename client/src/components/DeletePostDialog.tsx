import {
  Dialog,
  DialogContent,
  Button,
  Typography,
  Alert,
  Box,
} from '@mui/material'
import type { Post } from '../types/posts'

interface DeletePostDialogProps {
  open: boolean
  onClose: () => void
  post: Post | null
  onConfirm: () => void
  loading?: boolean
}

export function DeletePostDialog({
  open,
  onClose,
  post,
  onConfirm,
  loading = false,
}: DeletePostDialogProps) {
  const handleConfirm = () => {
    onConfirm()
  }

  if (!post) return null

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
          Delete post?
        </Typography>

        <Typography
          sx={{ fontSize: 15, lineHeight: 1.5, mb: 3 }}
          color='text.secondary'
        >
          Are you sure you want to delete this post? This action cannot be
          undone.
        </Typography>

        <Alert severity='warning' sx={{ mb: 3 }}>
          This will permanently delete your post and it cannot be recovered.
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            onClick={handleConfirm}
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
            {loading ? 'Deleting...' : 'Delete'}
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

