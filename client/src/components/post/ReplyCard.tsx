import { Box, Typography, Avatar, IconButton, Tooltip } from '@mui/material'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import FavoriteIcon from '@mui/icons-material/Favorite'
import DOMPurify from 'dompurify'
import type { Post } from '../../types/posts'
import { formatRelativeDate } from '../../utils/date'
import { useNavigate, useLocation } from 'react-router-dom'
import { getProfileUrlFromPost } from '../../utils/user'
import { useState } from 'react'

interface ReplyCardProps {
  reply: Post
  authorDisplayName?: string
  authorUsername: string
  onReply?: (post: Post) => void
  onLike?: (post: Post) => void
}

export function ReplyCard({
  reply,
  authorDisplayName: _authorDisplayName,
  authorUsername: _authorUsername,
  onReply,
  onLike,
}: ReplyCardProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isNavigating, setIsNavigating] = useState(false)
  
  const displayAuthorUsername = reply.author_username || 'unknown'
  const displayAuthorName =
    reply.author_name ||
    (reply.author_username
      ? reply.author_username.split('@')[0]
      : displayAuthorUsername.split('@')[0])

  const handleReply = () => {
    onReply?.(reply)
  }

  const handleLike = () => {
    onLike?.(reply)
  }

  const handleReplyClick = (event: React.MouseEvent) => {
    // Don't navigate when clicking links in reply content - let them open normally
    if ((event.target as HTMLElement).closest('a')) return
    if (isNavigating) return

    if (reply.noteId) {
      const targetPath = `/post?url=${encodeURIComponent(reply.noteId)}`
      const currentPath = location.pathname + location.search
      if (currentPath === targetPath) return
      setIsNavigating(true)
      navigate(targetPath)
      setTimeout(() => setIsNavigating(false), 500)
      return
    }

    const username = reply.author_username
    const guid = reply.guid
    if (!username || !guid) return

    const fallbackNoteId = `${window.location.origin}/u/${username}/statuses/${guid}`
    const targetPath = `/post?url=${encodeURIComponent(fallbackNoteId)}`
    const currentPath = location.pathname + location.search
    if (currentPath === targetPath) return

    setIsNavigating(true)
    navigate(targetPath)
    setTimeout(() => setIsNavigating(false), 500)
  }

  return (
    <Box
      onClick={handleReplyClick}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'rgba(0, 0, 0, 0.08)',
        px: 3,
        py: 2,
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.03)',
        },
        transition: 'background-color 0.2s',
      }}
    >
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'primary.main',
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          {displayAuthorUsername.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography
              component="a"
              href={getProfileUrlFromPost(displayAuthorUsername, reply.noteId, reply.raw_message)}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                navigate(getProfileUrlFromPost(displayAuthorUsername, reply.noteId, reply.raw_message))
              }}
              sx={{
                fontSize: 15,
                fontWeight: 700,
                color: 'text.primary',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
                cursor: 'pointer',
              }}
            >
              {displayAuthorName}
            </Typography>
            <Typography
              sx={{
                fontSize: 15,
                color: 'text.secondary',
                mx: 0.5,
              }}
            >
              ·
            </Typography>
            <Typography
              sx={{
                fontSize: 15,
                color: 'text.secondary',
              }}
            >
              {formatRelativeDate(reply.created_at)}
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: 15,
              color: 'text.primary',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              mb: 2,
              lineHeight: 1.5,
              '& a': {
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              },
            }}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(reply.content, {
                ALLOWED_TAGS: ['p', 'br', 'a', 'strong', 'em', 'u'],
                ALLOWED_ATTR: ['href'],
              }),
            }}
          />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              maxWidth: 425,
            }}
          >
            <Tooltip title='Reply'>
              <IconButton
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleReply()
                }}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: 'rgba(29, 155, 240, 0.1)',
                  },
                  transition: 'all 0.2s',
                }}
                size='small'
              >
                <ChatBubbleOutlineIcon sx={{ fontSize: 18.75 }} />
              </IconButton>
            </Tooltip>
            {reply.repliesCount !== undefined && reply.repliesCount > 0 && (
              <Typography
                sx={{
                  fontSize: 13,
                  color: 'text.secondary',
                  ml: -3,
                }}
              >
                {reply.repliesCount}
              </Typography>
            )}

            <Tooltip title={reply.isLiked ? 'Unlike' : 'Like'}>
              <IconButton
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleLike()
                }}
                sx={{
                  color: reply.isLiked ? '#f4212e' : 'text.secondary',
                  '&:hover': {
                    color: '#f4212e',
                    backgroundColor: 'rgba(244, 33, 46, 0.1)',
                  },
                  transition: 'all 0.2s',
                }}
                size='small'
              >
                {reply.isLiked ? (
                  <FavoriteIcon sx={{ fontSize: 18.75 }} />
                ) : (
                  <FavoriteBorderIcon sx={{ fontSize: 18.75 }} />
                )}
              </IconButton>
            </Tooltip>
            {reply.likesCount !== undefined && (
              <Typography
                sx={{
                  fontSize: 13,
                  color: reply.isLiked ? '#f4212e' : 'text.secondary',
                  ml: -3,
                  minWidth: 20,
                  textAlign: 'left',
                }}
              >
                {reply.likesCount > 0 ? reply.likesCount : ''}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

