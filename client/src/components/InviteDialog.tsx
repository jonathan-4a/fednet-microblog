// src/components/InviteDialog.tsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material'
import { ContentCopy as ContentCopyIcon } from '@mui/icons-material'
import { useInviteMutation } from '../hooks/mutations/useInviteMutation'
import { useState } from 'react'
import { copyToClipboard } from '../utils/clipboard'

interface InviteDialogProps {
  open: boolean
  onClose: () => void
}

export function InviteDialog({ open, onClose }: InviteDialogProps) {
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { mutateAsync: generateInvite, isPending: loading, error } =
    useInviteMutation()

  const handleGenerate = async () => {
    try {
      const response = await generateInvite()
      const baseUrl = window.location.origin
      const link = `${baseUrl}/register?token=${response.token}`
      setInviteLink(link)
    } catch {
      // Error is handled by hook
    }
  }

  const handleCopyToClipboard = async () => {
    if (!inviteLink) return
    const success = await copyToClipboard(inviteLink)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setInviteLink(null)
    setCopied(false)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Generate Invite Link</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        )}

        {!inviteLink ? (
          <Box>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Generate an invite link that others can use to register on this server.
            </Typography>
            <Button
              variant='contained'
              onClick={handleGenerate}
              disabled={loading}
              fullWidth
              sx={{
                borderRadius: 25,
                textTransform: 'none',
                fontWeight: 700,
                py: 1.5,
                color: '#fff',
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Generate Invite Link'}
            </Button>
          </Box>
        ) : (
          <Box>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
              Share this link with others to allow them to register:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                fullWidth
                value={inviteLink}
                size='small'
              />
              <IconButton
                onClick={handleCopyToClipboard}
                color={copied ? 'success' : 'default'}
              >
                <ContentCopyIcon />
              </IconButton>
            </Box>
            {copied && (
              <Typography variant='body2' color='success.main' sx={{ mt: 1 }}>
                Copied to clipboard!
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleClose}
          variant='outlined'
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
          {inviteLink ? 'Close' : 'Cancel'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}


