// src/components/profile/FollowButton.tsx
import { Button } from '@mui/material'
import { useState, useRef, useEffect } from 'react'

interface FollowButtonProps {
  isFollowing: boolean
  disabled?: boolean
  width?: number
  height?: number
  onClick: (e: React.MouseEvent) => void
}

const HOVER_IGNORE_DURATION_MS = 500

export function FollowButton({
  isFollowing,
  disabled,
  width,
  height = 30,
  onClick,
}: FollowButtonProps) {
  const [isHovering, setIsHovering] = useState(false)
  const prevIsFollowingRef = useRef(isFollowing)
  const lastFollowClickTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!prevIsFollowingRef.current && isFollowing) {
      lastFollowClickTimeRef.current = Date.now()
      requestAnimationFrame(() => {
        setIsHovering(false)
      })
    }
    prevIsFollowingRef.current = isFollowing
  }, [isFollowing])

  const handleMouseEnter = () => {
    if (!isFollowing) {
      setIsHovering(false)
      return
    }

    const timeSinceClick = Date.now() - lastFollowClickTimeRef.current
    if (timeSinceClick < HOVER_IGNORE_DURATION_MS) {
      setIsHovering(false)
      return
    }

    setIsHovering(true)
  }

  const handleMouseLeave = () => {
    if (isFollowing) {
      setIsHovering(false)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    lastFollowClickTimeRef.current = Date.now()
    setIsHovering(false)
    onClick(e)
  }

  const getText = () => {
    if (isFollowing) return isHovering ? 'Unfollow' : 'Following'
    return 'Follow'
  }

  return (
    <Button
      variant={isFollowing ? 'outlined' : 'contained'}
      onClick={handleClick}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        borderRadius: 25,
        textTransform: 'none',
        fontWeight: 800,
        height,
        width: isFollowing ? 1.1 * width! : width!,
        fontSize: '14px',
        ...(isFollowing
          ? {
              color: isHovering ? '#f4212e' : 'primary.main',
              borderColor: isHovering ? '#f4212e' : 'primary.main',
              backgroundColor: isHovering
                ? 'rgba(244,33,46,0.1)'
                : 'transparent',
              '&.Mui-disabled': {
                color: 'primary.main',
                borderColor: 'primary.main',
                backgroundColor: 'transparent',
              },
            }
          : {
              color: '#fff',
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              '&.Mui-disabled': {
                color: '#fff',
                backgroundColor: 'primary.main',
              },
            }),
      }}
    >
      {getText()}
    </Button>
  )
}


