// src/components/profile/UserListItem.tsx
import {
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Box,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { isRemoteUser, formatUserAddress } from '../../utils/user'
import { FollowButton } from './FollowButton'

interface UserListItemProps {
  user: {
    id: string
    name?: string
    preferredUsername: string
    summary?: string
    icon?: { url: string }
  }
  isMe: boolean
  isFollowing: boolean
  isLoading: boolean
  showFollow: boolean
  onFollow: (id: string) => void
  onUnfollowRequest: (user: { id: string; username: string }) => void
  width?: number
  height?: number
}

export function UserListItem({
  user,
  isMe,
  isFollowing,
  isLoading,
  showFollow,
  onFollow,
  onUnfollowRequest,
  width = 35,
  height = 30,
}: UserListItemProps) {
  const navigate = useNavigate()

  const handleUserClick = () => {
    if (isRemoteUser(user.id)) {
      navigate(`/profile/remote?url=${encodeURIComponent(user.id)}`)
    } else {
      navigate(`/profile/${user.preferredUsername}`)
    }
  }

  return (
    <ListItem
      onClick={handleUserClick}
      sx={{
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.03)',
          cursor: 'pointer',
        },
      }}
      secondaryAction={
        showFollow &&
        !isMe && (
          <FollowButton
            isFollowing={isFollowing}
            disabled={!!isLoading}
            width={width}
            height={height}
            onClick={(e) => {
              e.stopPropagation()
              if (isFollowing) {
                onUnfollowRequest({
                  id: user.id,
                  username: user.preferredUsername,
                })
              } else {
                onFollow(user.id)
              }
            }}
          />
        )
      }
    >
      <ListItemAvatar>
        <Avatar src={user.icon?.url}>
          {user.preferredUsername?.[0]?.toUpperCase()}
        </Avatar>
      </ListItemAvatar>

      <ListItemText
        primary={
          <Typography
            sx={{
              fontSize: 15,
              fontWeight: 700,
              color: 'text.primary',
              mb: 0.5,
            }}
          >
            {user.name || user.preferredUsername}
          </Typography>
        }
        secondary={
          <Box
            component='span'
            sx={{ display: 'flex', flexDirection: 'column' }}
          >
            <Typography
              component='span'
              sx={{
                fontSize: 15,
                color: 'text.secondary',
                mb: user.summary ? 0.5 : 0,
              }}
            >
              {formatUserAddress(user.id, user.preferredUsername)}
            </Typography>
            {user.summary && (
              <Typography
                component='span'
                variant='body2'
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  color: 'text.secondary',
                  lineHeight: 1.4,
                }}
              >
                {user.summary}
              </Typography>
            )}
          </Box>
        }
      />
    </ListItem>
  )
}

