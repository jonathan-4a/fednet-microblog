// src/components/EditProfileDialog.tsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material'
import { useEditProfileMutation } from '../hooks/mutations/useEditProfileMutation'
import { useState, useEffect } from 'react'
import type { UpdateProfileRequest, UserProfileOutput } from '../types/user'

interface EditProfileDialogProps {
  open: boolean
  onClose: () => void
  profile: UserProfileOutput | null
  onUpdate: () => void
}

export function EditProfileDialog({
  open,
  onClose,
  profile,
  onUpdate,
}: EditProfileDialogProps) {
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    displayName: '',
    summary: '',
  })
  const {
    mutateAsync: updateProfile,
    isPending: loading,
    error,
  } = useEditProfileMutation()

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        summary: profile.summary || '',
      })
    }
  }, [profile])

  const handleChange =
    (field: keyof UpdateProfileRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }))
    }

  const onSubmit = async () => {
    try {
      await updateProfile(formData)
      onUpdate()
      onClose()
    } catch {
      // Error is handled by hook
    }
  }

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      backgroundColor: 'rgba(245,248,251,1)',
      '& fieldset': { borderColor: 'rgba(216,226,236,1)', borderWidth: 1.5 },
      '&:hover fieldset': { borderColor: 'rgba(15,20,25,0.24)' },
      '&.Mui-focused fieldset': { borderColor: 'primary.main' },
    },
  } as const

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogContent>
        {error && (
          <Box sx={{ color: 'error.main', mb: 2 }}>{error.message}</Box>
        )}
        <TextField
          fullWidth
          label='Display Name'
          value={formData.displayName}
          onChange={handleChange('displayName')}
          margin='normal'
          sx={fieldSx}
        />
        <TextField
          fullWidth
          label='Bio'
          value={formData.summary}
          onChange={handleChange('summary')}
          margin='normal'
          multiline
          rows={4}
          sx={fieldSx}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
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
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          variant='contained'
          disabled={loading}
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
          }}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

