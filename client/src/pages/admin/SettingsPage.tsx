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
      <Typography variant='h5' gutterBottom sx={{ fontWeight: 700 }}>
        Settings
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      {success && (
        <Alert severity='success' sx={{ mb: 2 }}>
          Settings saved successfully
        </Alert>
      )}

      <Paper
        sx={{
          p: 3,
          mt: 2,
          border: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.08)',
          boxShadow: 'none',
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={localSettings?.registration_mode === 'invite'}
              onChange={handleChange('registration_mode')}
            />
          }
          label='Invite-only Registration'
        />

        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings?.allow_public_peers ?? false}
                onChange={handleChange('allow_public_peers')}
              />
            }
            label='Allow Public Peers'
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings?.auto_fetch_peer_links ?? false}
                onChange={handleChange('auto_fetch_peer_links')}
              />
            }
            label='Auto Fetch Peer Links'
          />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={saving}
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
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

