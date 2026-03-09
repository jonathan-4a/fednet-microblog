// src/pages/NotificationsPage.tsx
import { Box, Typography, Button, Link } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { TwitterLayout } from '../components/layout/TwitterLayout'
import { RGBA_COLORS, COLORS } from '../constants/theme'
import { useNotificationsQuery } from '../hooks/queries/useNotificationsQuery'
import { useActorsForNotifications } from '../hooks/queries/useActorsForNotifications'
import { useMarkNotificationReadMutation } from '../hooks/mutations/useMarkNotificationReadMutation'
import { useMarkAllNotificationsReadMutation } from '../hooks/mutations/useMarkAllNotificationsReadMutation'
import { parseActorUrl } from '../utils/actor'
import { getProfileUrlFromActorUrl } from '../utils/user'
import { formatRelativeDate } from '../utils/date'
import type { Notification } from '../types/notifications'

function actionText(n: Notification): string {
  switch (n.type) {
    case 'follow':
      return ' followed you'
    case 'reply':
      return ' replied to your post'
    case 'like':
      return ' liked your post'
    case 'repost':
      return ' reposted your post'
    default:
      return ' did something'
  }
}

function notificationLink(n: Notification): string | null {
  if (n.type === 'reply' && n.objectId) return `/post?url=${encodeURIComponent(n.objectId)}`
  if (n.type === 'like' && n.objectId) return `/post?url=${encodeURIComponent(n.objectId)}`
  if (n.type === 'repost' && n.objectId) return `/post?url=${encodeURIComponent(n.objectId)}`
  if (n.type === 'follow') return getProfileUrlFromActorUrl(n.actor)
  return null
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useNotificationsQuery({ limit: 50, offset: 0 })
  const markRead = useMarkNotificationReadMutation()
  const markAllRead = useMarkAllNotificationsReadMutation()

  const unreadCount = data?.unreadCount ?? 0
  const notifications = data?.notifications ?? []
  const actorsMap = useActorsForNotifications(notifications.map((n) => n.actor))

  const handleNotificationClick = (n: Notification) => {
    if (!n.readAt) markRead.mutate(n.id)
    const link = notificationLink(n)
    if (link) navigate(link)
  }

  const handleActorClick = (e: React.MouseEvent, n: Notification) => {
    e.stopPropagation()
    const profileUrl = getProfileUrlFromActorUrl(n.actor)
    if (!n.readAt) markRead.mutate(n.id)
    navigate(profileUrl)
  }

  return (
    <TwitterLayout>
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: RGBA_COLORS.border,
            position: 'sticky',
            top: 0,
            backgroundColor: 'background.paper',
            backdropFilter: 'blur(12px)',
            zIndex: 10,
            minHeight: 52,
            px: 3,
            py: 1.5,
          }}
        >
          <Typography
            sx={{
              fontSize: 20,
              fontWeight: 700,
              color: 'text.primary',
              letterSpacing: '-0.02em',
            }}
          >
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button
              size='small'
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 14,
                color: COLORS.twitterBlue,
              }}
            >
              Mark all read
            </Button>
          )}
        </Box>

        <Box sx={{ px: 0, py: 0 }}>
          {isLoading ? (
            <Box sx={{ px: 3, py: 6, textAlign: 'center' }}>
              <Typography color='text.secondary' sx={{ fontSize: 15 }}>
                Loading…
              </Typography>
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ px: 3, py: 8, textAlign: 'center' }}>
              <Typography color='text.secondary' sx={{ fontSize: 15 }}>
                No notifications yet
              </Typography>
            </Box>
          ) : (
            <Box sx={{ borderTop: '1px solid', borderColor: RGBA_COLORS.border }}>
              {notifications.map((n) => {
                const actorInfo = actorsMap.get(n.actor)
                const displayName = actorInfo?.name ?? parseActorUrl(n.actor).username
                return (
                  <Box
                    key={n.id}
                    component='button'
                    onClick={() => handleNotificationClick(n)}
                    sx={{
                      display: 'block',
                      width: '100%',
                      px: 3,
                      py: 2,
                      border: 'none',
                      borderBottom: '1px solid',
                      borderColor: RGBA_COLORS.border,
                      bgcolor: n.readAt ? 'transparent' : 'action.hover',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.15s ease',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <Typography
                      component='span'
                      sx={{
                        fontSize: 15,
                        fontWeight: n.readAt ? 400 : 600,
                        color: 'text.primary',
                        lineHeight: 1.5,
                      }}
                    >
                      <Link
                        component='button'
                        variant='inherit'
                        onClick={(e) => handleActorClick(e, n)}
                        sx={{
                          color: COLORS.twitterBlue,
                          fontWeight: 700,
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' },
                          p: 0,
                          border: 'none',
                          bg: 'transparent',
                          cursor: 'pointer',
                          fontSize: 'inherit',
                          lineHeight: 'inherit',
                        }}
                      >
                        {displayName}
                      </Link>
                      {actionText(n)}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 13,
                        color: 'text.secondary',
                        mt: 0.5,
                      }}
                    >
                      {formatRelativeDate(new Date(n.createdAt * 1000).toISOString())}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
          )}
        </Box>
      </Box>
    </TwitterLayout>
  )
}
