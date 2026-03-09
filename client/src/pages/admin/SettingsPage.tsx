// src/pages/admin/SettingsPage.tsx
import {
  Box,
  Paper,
  Typography,
  FormControlLabel,
  Switch,
  Button,
  Alert,
} from '@mui/material'
import { useAdminSettingsQuery } from '../../hooks/queries/useAdminQueries'
import { useUpdateSettingsMutation } from '../../hooks/mutations/useAdminMutations'
import { useState, useEffect } from 'react'
import { LoadingSpinner } from '../../components/LoadingSpinner'

export function SettingsPage() {
  const { data: settings, isLoading: loading, error } = useAdminSettingsQuery()
  const { mutateAsync: updateSettings, isPending: saving } =
    useUpdateSettingsMutation()
  const [localSettings, setLocalSettings] = useState(settings)
  const [success, setSuccess] = useState(false)

  // Update local settings when query data changes
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings)
    }
  }, [settings])

  const handleChange =
    (
      field:
        | 'registration_mode'
        | 'allow_public_peers'
        | 'auto_fetch_peer_links'
    ) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!localSettings) return

      if (field === 'registration_mode') {
        setLocalSettings({
          ...localSettings,
          registration_mode: event.target.checked ? 'invite' : 'open',
        })
      } else if (
        field === 'allow_public_peers' ||
        field === 'auto_fetch_peer_links'
      ) {
        setLocalSettings({
          ...localSettings,
          [field]: event.target.checked,
        })
      }
    }

  const handleSave = async () => {
    if (!localSettings) return
    try {
      await updateSettings(localSettings)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      // Error handled by hook
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!settings) return null

  return (
    <Box>
      <Typography
        sx={{
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'text.primary',
          mb: 2,
        }}
      >
        Settings
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 1.5, '& .MuiAlert-message': { fontSize: 13 } }}>
          {error.message}
        </Alert>
      )}

      {success && (
        <Alert severity='success' sx={{ mb: 1.5, '& .MuiAlert-message': { fontSize: 13 } }}>
          Settings saved successfully
        </Alert>
      )}

      <Paper
        sx={{
          p: 2.5,
          mt: 1.5,
          border: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.08)',
          boxShadow: 'none',
          borderRadius: 2,
        }}
      >
        <FormControlLabel
          control={
            <Switch
              size='small'
              checked={localSettings?.registration_mode === 'invite'}
              onChange={handleChange('registration_mode')}
            />
          }
          label={<span style={{ fontSize: 13 }}>Invite Only</span>}
        />

        <Box sx={{ mt: 1.5 }}>
          <FormControlLabel
            control={
              <Switch
                size='small'
                checked={localSettings?.allow_public_peers ?? false}
                onChange={handleChange('allow_public_peers')}
              />
            }
            label={<span style={{ fontSize: 13 }}>Allow Public Peers</span>}
          />
        </Box>

        <Box sx={{ mt: 1.5 }}>
          <FormControlLabel
            control={
              <Switch
                size='small'
                checked={localSettings?.auto_fetch_peer_links ?? false}
                onChange={handleChange('auto_fetch_peer_links')}
              />
            }
            label={<span style={{ fontSize: 13 }}>Auto-Fetch Peer Links</span>}
          />
        </Box>

        <Box sx={{ mt: 2.5 }}>
          <Button
            variant='contained'
            size='small'
            onClick={handleSave}
            disabled={saving}
            sx={{
              borderRadius: 25,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 13,
              px: 2.5,
              py: 0.75,
              color: '#fff',
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none', filter: 'brightness(0.97)' },
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

