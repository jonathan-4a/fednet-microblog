// src/components/EditPostDialog.tsx
import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
} from '@mui/material'
import type { Post } from '../types/posts'

interface EditPostDialogProps {
  open: boolean
  onClose: () => void
  post: Post | null
  onSuccess: () => void
  onSubmit: (guid: string, content: string) => Promise<void>
}

export function EditPostDialog({
  open,
  onClose,
  post,
  onSuccess,
  onSubmit,
}: EditPostDialogProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const textFieldRef = useRef<HTMLTextAreaElement>(null)
  const hasInitializedFocus = useRef(false)

  useEffect(() => {
    if (post) {
      setContent(post.content)
      setError(null)
      hasInitializedFocus.current = false // Reset when post changes
    }
  }, [post])

  // Auto-focus text field when dialog opens (only once when dialog first opens)
  useEffect(() => {
    if (open && post && content && !hasInitializedFocus.current) {
      // Small delay to ensure dialog is fully rendered and content is set
      const timeoutId = setTimeout(() => {
        const textField = textFieldRef.current
        if (textField && content && !hasInitializedFocus.current) {
          textField.focus()
          // Move cursor to end of text when editing (so user can append)
          // For textarea (multiline), setSelectionRange works the same way
          const length = content.length
          if (length > 0) {
            textField.setSelectionRange(length, length)
          }
          hasInitializedFocus.current = true // Mark as initialized
        }
      }, 250)
      
      return () => clearTimeout(timeoutId)
    }
    
    // Reset when dialog closes
    if (!open) {
      hasInitializedFocus.current = false
    }
  }, [open, post, content]) // Include content to ensure it's set before positioning cursor

  const handleClose = () => {
    if (!loading) {
      setContent('')
      setError(null)
      onClose()
    }
  }

  const handleSubmit = async () => {
    if (!post) return

    if (!content.trim()) {
      setError('Post content cannot be empty')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onSubmit(post.guid, content.trim())
      // Only close and call onSuccess after successful update
      setContent('')
      setError(null)
      onSuccess()
      onClose()
    } catch (err) {
      let errorMessage = 'Failed to update post'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message)
      }
      setError(errorMessage)
      setLoading(false)
    }
  }

  if (!post) return null

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: 20, pb: 1 }}>
        Edit Post
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            inputRef={textFieldRef}
            autoFocus
            multiline
            rows={6}
            fullWidth
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            variant='outlined'
            disabled={loading}
            inputProps={{ maxLength: 500 }}
            InputProps={{
              inputComponent: 'textarea' as any,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: 15,
                '& fieldset': {
                  border: 'none',
                },
              },
            }}
          />
          <Typography
            variant='caption'
            sx={{
              mt: 1,
              display: 'block',
              textAlign: 'right',
              color: 'text.secondary',
            }}
          >
            {content.length}/500
          </Typography>
        </Box>
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
          disabled={loading || !content.trim()}
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
          {loading ? 'Saving...' : 'Done'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

