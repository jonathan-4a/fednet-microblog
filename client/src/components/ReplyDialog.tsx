// src/components/ReplyDialog.tsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Avatar,
  Divider,
} from '@mui/material'
import { useState, useEffect, useRef } from 'react'
import DOMPurify from 'dompurify'
import { useCreatePostMutation } from '../hooks/mutations/useCreatePostMutation'
import type { Post } from '../types/posts'

interface ReplyDialogProps {
  open: boolean
  onClose: () => void
  post: Post | null
  onSuccess?: () => void
}

export function ReplyDialog({
  open,
  onClose,
  post,
  onSuccess,
}: ReplyDialogProps) {
  const [content, setContent] = useState('')
  const {
    mutateAsync: submitPost,
    isPending: loading,
    error,
  } = useCreatePostMutation()
  const textFieldRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus text field when dialog opens
  useEffect(() => {
    if (open && textFieldRef.current) {
      // Small delay to ensure dialog is fully rendered
      const timeoutId = setTimeout(() => {
        const textField = textFieldRef.current
        if (textField) {
          textField.focus()
        }
      }, 150)
      
      return () => clearTimeout(timeoutId)
    }
  }, [open])

  const handleClose = () => {
    if (!loading) {
      setContent('')
      onClose()
    }
  }

  const handleSubmit = async () => {
    if (!content.trim() || loading || !post) return

    try {
      await submitPost({
        content: content.trim(),
        inReplyTo: post.noteId || null,
      })
      setContent('')
      onSuccess?.()
      onClose()
    } catch {
      // Error is handled by the hook
    }
  }

  const characterCount = content.length
  const maxLength = 5000
  const isOverLimit = characterCount > maxLength

  if (!post) return null

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
        Reply
      </DialogTitle>
      <DialogContent>
        {/* Show original post */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                fontWeight: 600,
              }}
            >
              {authorInitials}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'text.primary',
                  }}
                >
                  {post.author_username}
                </Typography>
              </Box>
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
                    '&:hover': {
                      textDecoration: 'underline',
                    },
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

        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        )}
        <TextField
          inputRef={textFieldRef}
          autoFocus
          fullWidth
          multiline
          rows={4}
          placeholder='Post your reply'
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
          error={isOverLimit}
          helperText={
            isOverLimit
              ? `Character limit exceeded (${characterCount}/${maxLength})`
              : `${characterCount}/${maxLength} characters`
          }
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: 15,
              '& fieldset': {
                border: 'none',
              },
            },
          }}
          inputProps={{
            maxLength: maxLength,
          }}
        />
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
          onClick={handleSubmit}
          variant='contained'
          disabled={loading || !content.trim() || isOverLimit}
          sx={{
            borderRadius: 25,
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            color: '#fff',
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
            '&:disabled': {
              backgroundColor: 'rgba(0, 0, 0, 0.12)',
              color: 'rgba(0, 0, 0, 0.26)',
            },
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <span>Replying...</span>
            </Box>
          ) : (
            'Reply'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

