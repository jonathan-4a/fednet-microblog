// src/components/RepostDialog.tsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Typography,
  Avatar,
  Divider,
} from '@mui/material'
import DOMPurify from 'dompurify'
import { useRepostMutation } from '../hooks/mutations/useRepostMutation'
import type { Post } from '../types/posts'
import { API_BASE } from '../config'
import { COLORS } from '../constants/theme'

interface RepostDialogProps {
  open: boolean
  onClose: () => void
  post: Post | null
  onSuccess?: () => void
}

export function RepostDialog({
  open,
  onClose,
  post,
  onSuccess,
}: RepostDialogProps) {
  const { mutateAsync: performRepost, isPending: loading } = useRepostMutation()

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  const getNoteId = (): string | null => {
    if (!post) return null
    if (post.noteId) return post.noteId
    if (post.author_username && post.guid) {
      return `${API_BASE}/u/${post.author_username}/statuses/${post.guid}`
    }
    return null
  }

  const handleRepost = async () => {
    const noteId = getNoteId()
    if (!noteId || loading) return
    try {
      await performRepost(noteId)
      onSuccess?.()
      onClose()
    } catch {
      // Error handled by mutation
    }
  }

  if (!post) return null

  const noteId = getNoteId()
  const authorInitials = (post.author_username || 'U').charAt(0).toUpperCase()

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: 20, pb: 1 }}>
        Repost
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
            <Avatar sx={{ width: 40, height: 40, fontWeight: 600 }}>
              {authorInitials}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary' }}>
                {post.author_username}
              </Typography>
              <Typography
                sx={{
                  fontSize: 15,
                  color: 'text.primary',
                  mt: 0.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.5,
                  '& a': {
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  },
                }}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(post.content, {
                    ALLOWED_TAGS: ['p', 'br', 'a', 'strong', 'em', 'u'],
                    ALLOWED_ATTR: ['href'],
                  }),
                }}
              />
            </Box>
          </Box>
          <Divider sx={{ my: 1.5 }} />
        </Box>

        <Typography sx={{ fontSize: 15, color: 'text.secondary' }}>
          Repost this post to your profile?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          variant='outlined'
          disabled={loading}
          sx={{
            borderRadius: 25,
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            color: 'primary.main',
            borderColor: 'primary.main',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'rgba(0, 0, 0, 0.03)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleRepost}
          variant='contained'
          disabled={loading || !noteId}
          sx={{
            borderRadius: 25,
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            color: COLORS.white,
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
              color: COLORS.white,
            },
            '&:disabled': {
              backgroundColor: 'rgba(0, 0, 0, 0.12)',
              color: 'rgba(0, 0, 0, 0.26)',
            },
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} color='inherit' />
              <span>Reposting...</span>
            </Box>
          ) : (
            'Repost'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

