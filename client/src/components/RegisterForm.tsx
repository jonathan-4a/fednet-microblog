import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Container,
  Paper,
} from '@mui/material'
import { useAuth } from '../hooks/useAuth'
import type { RegisterRequest } from '../types/auth'

export function RegisterForm() {
  const { register, loading, error } = useAuth()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('token') || ''

  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    password: '',
    displayName: '',
    summary: '',
    inviteToken: inviteToken,
  })

  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof RegisterRequest, string>>
  >({})

  const handleChange =
    (field: keyof RegisterRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({
        ...formData,
        [field]: e.target.value,
      })

      if (validationErrors[field]) {
        const nextErrors = { ...validationErrors }
        delete nextErrors[field]
        setValidationErrors(nextErrors)
      }
    }

  const validate = () => {
    const errors: Partial<Record<keyof RegisterRequest, string>> = {}

    if (!formData.username.trim()) {
      errors.username = 'Username is required'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    await register({
      username: formData.username.trim(),
      password: formData.password,
      displayName: formData.displayName?.trim() || undefined,
      summary: formData.summary?.trim() || undefined,
      inviteToken: inviteToken || undefined,
    })
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 64px)',
      }}
    >
      <Container maxWidth='sm'>
        <Paper sx={{ p: 3 }}>
          <Typography variant='h5' component='h1' gutterBottom>
            Register
          </Typography>

          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component='form' onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label='Username'
              value={formData.username}
              onChange={handleChange('username')}
              error={Boolean(validationErrors.username)}
              helperText={validationErrors.username}
              margin='normal'
              required
              disabled={loading}
            />

            <TextField
              fullWidth
              label='Password'
              type='password'
              value={formData.password}
              onChange={handleChange('password')}
              error={Boolean(validationErrors.password)}
              helperText={validationErrors.password}
              margin='normal'
              required
              disabled={loading}
            />

            <TextField
              fullWidth
              label='Display Name'
              value={formData.displayName}
              onChange={handleChange('displayName')}
              margin='normal'
              disabled={loading}
            />

            <TextField
              fullWidth
              label='Bio'
              value={formData.summary}
              onChange={handleChange('summary')}
              margin='normal'
              multiline
              rows={3}
              disabled={loading}
            />

            <Button
              type='submit'
              fullWidth
              variant='contained'
              disabled={loading}
              sx={{
                mt: 2,
                borderRadius: 25,
                textTransform: 'none',
                fontWeight: 700,
                py: 1.5,
                color: 'white',
                '&:hover': {
                  color: 'white',
                },
                '&:disabled': {
                  color: 'rgba(255, 255, 255, 0.5)',
                },
              }}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant='body2' color='text.secondary'>
              Already have an account?{' '}
              <Link
                to='/login'
                style={{
                  color: 'inherit',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Login
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}

