import { useState } from 'react'
import { Link } from 'react-router-dom'
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
import type { LoginRequest } from '../types/auth'

export function LoginForm() {
  const { login, loading, error } = useAuth()

  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: '',
  })

  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof LoginRequest, string>>
  >({})

  const handleChange =
    (field: keyof LoginRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const errors: Partial<Record<keyof LoginRequest, string>> = {}

    if (!formData.username.trim()) {
      errors.username = 'Username is required'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await login(formData)
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
            Login
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
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant='body2' color='text.secondary'>
              Don't have an account?{' '}
              <Link
                to='/register'
                style={{
                  color: 'inherit',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Register
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}

