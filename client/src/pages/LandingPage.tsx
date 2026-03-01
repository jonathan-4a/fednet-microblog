// src/pages/LandingPage.tsx
import { Box, Typography, Button, Container, Paper } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import PeopleIcon from '@mui/icons-material/People'
import PublicIcon from '@mui/icons-material/Public'
import SecurityIcon from '@mui/icons-material/Security'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'

export function LandingPage() {
  return (
    <Box
      sx={{
        height: '100vh',
        backgroundColor: 'background.default',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Curved header */}
      <Box
        sx={{
          height: { xs: 180, md: 200 },
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
          borderBottomLeftRadius: '50% 20%',
          borderBottomRightRadius: '50% 20%',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.25,
            background:
              'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.8), transparent 55%)',
          }}
        />
      </Box>

      <Container
        maxWidth='md'
        sx={{
          position: 'relative',
          top: { xs: -80, md: -100 },
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          pb: 2,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
          <Typography
            sx={{
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              fontWeight: 800,
              color: 'text.primary',
              letterSpacing: '-0.01em',
              mb: 1.5,
            }}
          >
            Federated Social Network
          </Typography>

          <Typography
            sx={{
              maxWidth: 560,
              mx: 'auto',
              color: 'text.secondary',
              fontSize: { xs: 14, md: 16 },
              lineHeight: 1.5,
              mb: 15,
            }}
          >
            A lighter social space built for clean browsing across the
            fediverse.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              component={RouterLink}
              to='/register'
              variant='contained'
              sx={{
                px: 4,
                minWidth: 140,
                borderRadius: 3,
                color: '#fff',
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              Get Started
            </Button>
            <Button
              component={RouterLink}
              to='/login'
              variant='outlined'
              sx={{ px: 4, minWidth: 140, borderRadius: 3 }}
            >
              Sign In
            </Button>
          </Box>
        </Box>

        {/* Feature grid with glass cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2,1fr)',
              md: 'repeat(4,1fr)',
            },
            gap: { xs: 2, md: 2.5 },
            flex: 1,
            alignContent: 'start',
          }}
        >
          {[
            {
              icon: PeopleIcon,
              title: 'Connect',
              description: 'Interact across the fediverse',
            },
            {
              icon: PublicIcon,
              title: 'Open Network',
              description: 'Communication beyond one server',
            },
            {
              icon: SecurityIcon,
              title: 'Private',
              description: 'Control stays with you',
            },
            {
              icon: ChatBubbleOutlineIcon,
              title: 'Share',
              description: 'Post and explore with ease',
            },
          ].map((item, i) => (
            <Paper
              key={i}
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 3 },
                borderRadius: 3,
                backgroundColor: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(0,0,0,0.08)',
                textAlign: 'center',
                transition: '0.3s',
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                },
              }}
            >
              <Box
                sx={{
                  width: { xs: 52, md: 56 },
                  height: { xs: 52, md: 56 },
                  borderRadius: 2.5,
                  mx: 'auto',
                  mb: { xs: 2, md: 2.5 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: (theme) =>
                    theme.palette.primary.light + '33',
                }}
              >
                <item.icon
                  sx={{
                    fontSize: { xs: 26, md: 28 },
                    color: 'primary.main',
                  }}
                />
              </Box>

              <Typography
                sx={{
                  fontWeight: 700,
                  mb: { xs: 0.8, md: 1 },
                  fontSize: { xs: 15, md: 16 },
                }}
              >
                {item.title}
              </Typography>

              <Typography
                sx={{
                  color: 'text.secondary',
                  fontSize: { xs: 13, md: 14 },
                }}
              >
                {item.description}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  )
}



