// src/components/LoginForm.tsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, TextField, Typography, Alert, Paper } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../hooks/useAuth';
import type { LoginRequest } from '../types/auth';
import { COLORS } from '../constants/theme';

export function LoginForm() {
  const { login, loading, error } = useAuth();

  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: '',
  });

  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof LoginRequest, string>>
  >({});

  const handleChange =
    (field: keyof LoginRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value });
      if (validationErrors[field]) {
        const nextErrors = { ...validationErrors };
        delete nextErrors[field];
        setValidationErrors(nextErrors);
      }
    };

  const validate = () => {
    const errors: Partial<Record<keyof LoginRequest, string>> = {};
    if (!formData.username.trim()) errors.username = 'Username is required';
    if (!formData.password) errors.password = 'Password is required';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await login(formData);
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      backgroundColor: 'rgba(245,248,251,1)',
      '& fieldset': { borderColor: 'rgba(216,226,236,1)', borderWidth: 1.5 },
      '&:hover fieldset': { borderColor: 'rgba(15,20,25,0.24)' },
      '&.Mui-focused fieldset': { borderColor: 'primary.main' },
    },
  } as const;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'stretch',
        background: (theme) =>
          `radial-gradient(ellipse 70% 55% at 10% 0%, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 65%), radial-gradient(ellipse 50% 45% at 92% 100%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 60%), #eaf0f7`,
      }}
    >
      <Paper
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '30% 70%' },
          width: '100%',
          minHeight: '100vh',
          overflow: 'hidden',
          borderRadius: 0,
          boxShadow: 'none',
        }}
      >
        {/* LEFT – same hero as Register, light theme */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: '52px 48px',
            background: (theme) =>
              `
                radial-gradient(130% 180% at 0% 0%, ${alpha(
                  theme.palette.primary.main,
                  0.18,
                )} 0%, transparent 55%),
                radial-gradient(140% 190% at 100% 10%, ${alpha(
                  theme.palette.primary.main,
                  0.12,
                )} 0%, transparent 55%),
                radial-gradient(120% 180% at 10% 100%, ${alpha(
                  theme.palette.primary.main,
                  0.10,
                )} 0%, transparent 60%),
                linear-gradient(145deg, #f7f8fb 0%, #ffffff 40%, #f4f7fc 100%)
              `,
            backgroundBlendMode: 'soft-light, soft-light, normal, normal',
            position: 'relative',
            color: 'text.primary',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              width: 420,
              height: 420,
              borderRadius: '50%',
              background: (theme) =>
                `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 70%)`,
              top: -130,
              left: -130,
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: (theme) =>
                `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 70%)`,
              bottom: -60,
              right: -60,
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backgroundImage:
                'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)',
              backgroundSize: '38px 38px',
            }}
          />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              sx={{
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                color: 'text.secondary',
                fontWeight: 600,
              }}
            >
              Federated microblogging
            </Typography>
          </Box>

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              component='h2'
              sx={{
                fontFamily: 'Sora, sans-serif',
                fontWeight: 800,
                fontSize: 36,
                lineHeight: 1.18,
                letterSpacing: '-0.04em',
                mb: 2,
                color: 'text.primary',
              }}
            >
              Share your
              <br />
              <Box component='span' sx={{ color: 'primary.main' }}>
                thoughts
              </Box>
              <br />
              with the world.
            </Typography>
            <Typography
              sx={{
                fontSize: 14.5,
                lineHeight: 1.72,
                color: 'text.secondary',
                fontWeight: 300,
                maxWidth: 280,
              }}
            >
              A decentralized microblogging platform for open conversations
              across the Fediverse.
            </Typography>
          </Box>

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              sx={{ fontSize: 12.5, color: 'text.secondary' }}
            >
              Open source · Federated
            </Typography>
          </Box>
        </Box>

        {/* RIGHT */}
        <Box
          sx={{
            p: { xs: '40px 28px', md: '52px 56px' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 3,
            background: '#fff',
            maxWidth: 640,
            width: '100%',
            mx: 'auto',
          }}
        >
          <Box sx={{ mb: 0.5 }}>
            <Typography
              component='h1'
              sx={{
                fontWeight: 700,
                fontSize: 26,
                letterSpacing: '-0.02em',
                color: 'text.primary',
              }}
            >
              Sign in
            </Typography>
          </Box>

          {error && <Alert severity='error'>{error}</Alert>}

          <Box
            component='form'
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}
          >
            <TextField
              fullWidth
              size='small'
              label='Username'
              value={formData.username}
              onChange={handleChange('username')}
              error={Boolean(validationErrors.username)}
              helperText={validationErrors.username}
              required
              disabled={loading}
              autoComplete='username'
              sx={fieldSx}
            />

            <TextField
              fullWidth
              size='small'
              label='Password'
              type='password'
              value={formData.password}
              onChange={handleChange('password')}
              error={Boolean(validationErrors.password)}
              helperText={validationErrors.password}
              required
              disabled={loading}
              autoComplete='current-password'
              sx={fieldSx}
            />

            <Button
              type='submit'
              fullWidth
              variant='contained'
              color='primary'
              disabled={loading}
              disableElevation
              sx={{
                mt: 0.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: 15,
                py: 1.25,
                color: '#fff',
                '&:disabled': {
                  color: 'rgba(255,255,255,0.7)',
                },
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Box>

          <Typography
            sx={{
              textAlign: 'center',
              fontSize: 13.5,
              color: 'text.secondary',
            }}
          >
            Don't have an account?{' '}
            <Link
              to='/register'
              style={{
                color: COLORS.twitterBlue,
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Create one
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
