// src/components/NotificationBell.tsx
import { useState } from 'react'
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemText,
  Typography,
  Box,
  Button,
  Divider,
} from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import { useNavigate } from 'react-router-dom'
import { useNotificationsQuery } from '../hooks/queries/useNotificationsQuery'
import { useMarkNotificationReadMutation } from '../hooks/mutations/useMarkNotificationReadMutation'
import { useMarkAllNotificationsReadMutation } from '../hooks/mutations/useMarkAllNotificationsReadMutation'
import { parseActorUrl } from '../utils/actor'
import { getProfileUrlFromActorUrl } from '../utils/user'
import { formatRelativeDate } from '../utils/date'
import type { Notification } from '../types/notifications'

function notificationMessage(n: Notification): string {
  const { handle } = parseActorUrl(n.actor)
  switch (n.type) {
    case 'follow':
      return `${handle} followed you`
    case 'reply':
      return `${handle} replied to your post`
    case 'like':
      return `${handle} liked your post`
    case 'repost':
      return `${handle} reposted your post`
    default:
      return `${handle} did something`
  }
}

function notificationLink(n: Notification): string | null {
  if (n.type === 'reply' && n.objectId) return `/post?url=${encodeURIComponent(n.objectId)}`
  if (n.type === 'like' && n.objectId) return `/post?url=${encodeURIComponent(n.objectId)}`
  if (n.type === 'repost' && n.objectId) return `/post?url=${encodeURIComponent(n.objectId)}`
  if (n.type === 'follow') return getProfileUrlFromActorUrl(n.actor)
  return null
}

interface NotificationBellProps {
  variant?: 'sidebar' | 'icon'
}

export function NotificationBell({ variant = 'icon' }: NotificationBellProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const navigate = useNavigate()
  const { data, isLoading } = useNotificationsQuery({ limit: 20, offset: 0 })
  const markRead = useMarkNotificationReadMutation()
  const markAllRead = useMarkAllNotificationsReadMutation()

  const unreadCount = data?.unreadCount ?? 0
  const notifications = data?.notifications ?? []

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationClick = (n: Notification) => {
    if (!n.readAt) {
      markRead.mutate(n.id)
    }
    const link = notificationLink(n)
    if (link) navigate(link)
    handleClose()
  }

  const handleMarkAllRead = () => {
    markAllRead.mutate()
    handleClose()
  }

  return (
    <>
      {variant === 'icon' ? (
        <IconButton
          onClick={handleOpen}
          size='small'
          aria-label={unreadCount ? `${unreadCount} unread notifications` : 'Notifications'}
          sx={{ color: 'inherit' }}
        >
          <Badge badgeContent={unreadCount > 0 ? unreadCount : undefined} sx={{ '& .MuiBadge-badge': { backgroundColor: '#f94144' } }}>
            <NotificationsIcon fontSize='small' />
          </Badge>
        </IconButton>
      ) : (
        <Box
          component='button'
          onClick={handleOpen}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            width: '100%',
            p: 1.5,
            pr: 3,
            border: 'none',
            borderRadius: 3,
            cursor: 'pointer',
            bgcolor: 'transparent',
            color: 'inherit',
            textAlign: 'left',
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.03)' },
          }}
        >
          <Badge badgeContent={unreadCount > 0 ? unreadCount : undefined} sx={{ '& .MuiBadge-badge': { backgroundColor: '#f94144' } }}>
            <NotificationsIcon sx={{ fontSize: 28 }} />
          </Badge>
          <Typography sx={{ fontSize: 20, fontWeight: 500 }}>Notifications</Typography>
        </Box>
      )}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { minWidth: 320, maxWidth: 400, maxHeight: 400 },
        }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='subtitle1' fontWeight={700}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button size='small' onClick={handleMarkAllRead} disabled={markAllRead.isPending}>
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />
        {isLoading ? (
          <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
            Loading…
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
            No notifications yet
          </Box>
        ) : (
          notifications.map((n) => (
            <MenuItem
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              sx={{
                py: 1.5,
                whiteSpace: 'normal',
                bgcolor: n.readAt ? undefined : 'action.hover',
              }}
            >
              <ListItemText
                primary={notificationMessage(n)}
                secondary={formatRelativeDate(new Date(n.createdAt * 1000).toISOString())}
                primaryTypographyProps={{ fontWeight: n.readAt ? 400 : 600 }}
              />
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  )
}
