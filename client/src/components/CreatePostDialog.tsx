// src/components/CreatePostDialog.tsx
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
} from '@mui/material'
import { useState, useEffect, useRef } from 'react'
import { useCreatePostMutation } from '../hooks/mutations/useCreatePostMutation'

interface CreatePostDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreatePostDialog({
  open,
  onClose,
  onSuccess,
}: CreatePostDialogProps) {
  const [content, setContent] = useState('')
  const { mutateAsync: submitPost, isPending: loading, error } =
    useCreatePostMutation()
  const textFieldRef = useRef<HTMLInputElement>(null)

  // Auto-focus text field when dialog opens
  useEffect(() => {
    if (open && textFieldRef.current) {
      // Small delay to ensure dialog is fully rendered
      setTimeout(() => {
        const textField = textFieldRef.current
        if (textField) {
          textField.focus()
        }
      }, 150)
    }
  }, [open])

  const handleClose = () => {
    if (!loading) {
      setContent('')
      onClose()
    }
  }

  const handleSubmit = async () => {
    if (!content.trim() || loading) return

    try {
      await submitPost({ content: content.trim() })
      setContent('')
      onSuccess?.()
      onClose()
    } catch {
      // Error is handled by the hook
    }
  }

  const characterCount = content.length
  const maxLength = 5000 // Reasonable limit for posts
  const isOverLimit = characterCount > maxLength

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: 20, pb: 1 }}>
        Create Post
      </DialogTitle>
      <DialogContent>
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
          rows={6}
          placeholder="What's happening?"
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
              <span>Posting...</span>
            </Box>
          ) : (
            'Post'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

