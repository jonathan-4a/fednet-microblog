// src/components/UserCard.tsx
import { Box, Avatar, Typography, Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useState, useRef } from 'react'

const HOVER_IGNORE_DURATION_MS = 500
const FOLLOWING_BUTTON_WIDTH = 110

interface UserCardProps {
  username: string
  displayName?: string | null
  address?: string
  onClick?: () => void
  href?: string
  to?: string
  isFollowing?: boolean
  followLoading?: boolean
  onFollowClick?: () => void
  showFollowButton?: boolean
}

export function UserCard({
  username,
  displayName,
  address,
  onClick,
  href,
  to,
  isFollowing = false,
  followLoading = false,
  onFollowClick,
  showFollowButton = false,
}: UserCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const lastFollowClickTimeRef = useRef<number>(0)
  const name = displayName || username
  const initials = name.charAt(0).toUpperCase()

  const handleFollowClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!onFollowClick) return

    if (!isFollowing) {
      lastFollowClickTimeRef.current = Date.now()
      setIsHovered(false)
    }
    onFollowClick()
  }

  const handleMouseEnter = () => {
    if (!isFollowing) return

    const timeSinceClick = Date.now() - lastFollowClickTimeRef.current
    if (timeSinceClick < HOVER_IGNORE_DURATION_MS) return

    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    if (isFollowing) {
      setIsHovered(false)
    }
  }

  const buttonText = followLoading
    ? '...'
    : isFollowing && isHovered
    ? 'Unfollow'
    : isFollowing
    ? 'Following'
    : 'Follow'

  const content = (
    <Box
      sx={{
        cursor: 'pointer',
        px: 2,
        py: 1.5,
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        '&:hover': { backgroundColor: 'rgba(0,0,0,0.03)' },
      }}
      onClick={to || href ? undefined : onClick}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            fontWeight: 600,
          }}
        >
          {initials}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 14,
              color: 'text.primary',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {name}
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: 'text.secondary',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {address || `@${username}`}
          </Typography>
        </Box>

        {showFollowButton && onFollowClick && (
          <Button
            onClick={handleFollowClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            disabled={followLoading}
            variant={isFollowing ? 'outlined' : 'contained'}
            sx={{
              borderRadius: 20,
              textTransform: 'none',
              fontWeight: 700,
              height: 32,
              px: 3,
              ...(isFollowing && { width: FOLLOWING_BUTTON_WIDTH }),
              ...(!isFollowing && {
                color: '#fff',
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }),
              ...(isFollowing && {
                color: isHovered ? '#f4212e' : 'primary.main',
                borderColor: isHovered ? '#f4212e' : 'primary.main',
                backgroundColor: isHovered
                  ? 'rgba(244,33,46,0.1)'
                  : 'transparent',
              }),
            }}
          >
            {buttonText}
          </Button>
        )}
      </Box>
    </Box>
  )

  if (to) {
    return (
      <Box
        component={RouterLink}
        to={to}
        sx={{ textDecoration: 'none' }}
        onClick={(e: React.MouseEvent) => {
          // If clicking the follow button, prevent navigation
          const target = e.target as HTMLElement
          if (
            target.closest('button') ||
            target.closest('[role="button"]') ||
            (target as HTMLElement).tagName === 'BUTTON'
          ) {
            e.preventDefault()
          }
        }}
      >
        {content}
      </Box>
    )
  }

  if (href) {
    return (
      <Box component='a' href={href} target='_blank' rel='noreferrer'>
        {content}
      </Box>
    )
  }

  return content
}

