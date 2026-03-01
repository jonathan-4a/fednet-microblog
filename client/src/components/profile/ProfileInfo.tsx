// src/components/profile/ProfileInfo.tsx
import { useState } from 'react'
import { Box, Typography, Avatar, IconButton, Tooltip } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { copyToClipboard } from '../../utils/clipboard'
import type { Actor } from '../../types/activitypub'
import DOMPurify from 'dompurify'

interface ProfileInfoProps {
  profile: Actor
}

export function ProfileInfo({ profile }: ProfileInfoProps) {
  const [copySuccess, setCopySuccess] = useState(false)

  const displayName = profile.name || profile.preferredUsername

  const getAddress = () => {
    try {
      return `${profile.preferredUsername}@${new URL(profile.id).host}`
    } catch {
      return profile.preferredUsername
    }
  }

  const formatJoinDate = () =>
    profile.published
      ? new Date(profile.published).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null

  const handleCopyAddress = async () => {
    const success = await copyToClipboard(getAddress())
    if (success) {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  return (
    <>
      <Box sx={{ position: 'absolute', top: { xs: -60, sm: -80 } }}>
        <Avatar
          sx={{
            width: { xs: 100, sm: 133 },
            height: { xs: 100, sm: 133 },
            border: '4px solid',
            borderColor: '#fff',
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </Avatar>
      </Box>

      <Box sx={{ mt: { xs: 5, sm: 6 } }}>
        <Typography variant='h1' sx={{ fontSize: 20, fontWeight: 700, mb: 0.5 }}>
          {displayName}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant='body2' color='text.secondary'>
            {getAddress()}
          </Typography>
          <Tooltip title={copySuccess ? 'Copied!' : 'Copy address'}>
            <IconButton
              size='small'
              onClick={handleCopyAddress}
              sx={{
                color: copySuccess ? 'success.main' : 'text.secondary',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' },
                transition: 'all 0.2s',
              }}
            >
              <ContentCopyIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {profile.summary && (
          <Box
            sx={{
              mt: 2,
              mb: 2,
              p: 2,
              borderRadius: 4,
              backgroundColor: 'rgba(0,0,0,0.02)',
              border: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <Typography
              variant='caption'
              sx={{
                color: 'text.secondary',
                fontWeight: 700,
                letterSpacing: '0.05em',
                mb: 1,
                display: 'block',
                textTransform: 'uppercase',
              }}
            >
              Bio
            </Typography>
            <Typography
              variant='body1'
              sx={{
                fontSize: '15px',
                lineHeight: 1.5,
                color: 'text.primary',
                whiteSpace: 'pre-wrap',
                '& a': {
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                },
              }}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(profile.summary),
              }}
            />
          </Box>
        )}

        {formatJoinDate() && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant='body2' color='text.secondary' sx={{ fontWeight: 500 }}>
              {formatJoinDate()}
            </Typography>
          </Box>
        )}
      </Box>
    </>
  )
}


