import { Box, Typography, Avatar, CircularProgress } from '@mui/material'
import ReplyIcon from '@mui/icons-material/Reply'
import DOMPurify from 'dompurify'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getPostDetails } from '../../services/posts'
import { useAuthStore } from '../../stores/authStore'
import type { Post } from '../../types/posts'
import { formatRelativeDate } from '../../utils/date'
import { PostCard } from './PostCard'

export interface ReplyWithParentCardProps {
  reply: Post
  authorDisplayName?: string
  authorUsername: string
  onReply?: (post: Post) => void
  onRepost?: (post: Post) => void
  onLike?: (post: Post) => void
  onEdit?: (post: Post) => void
  onDelete?: (post: Post) => void
}

/**
 * Renders a reply with the parent post (the post it was replying to) shown above it.
 * Used in Profile Replies tab so the user can see to whom and which post they replied.
 */
export function ReplyWithParentCard({
  reply,
  authorDisplayName,
  authorUsername,
  onReply,
  onRepost,
  onLike,
  onEdit,
  onDelete,
}: ReplyWithParentCardProps) {
  const navigate = useNavigate()
  const currentUsername = useAuthStore((state) => state.user?.username)

  const inReplyToUrl = reply.inReplyTo || null
  const { data: parentPost, isLoading: parentLoading } = useQuery({
    queryKey: ['post', 'parent', inReplyToUrl],
    queryFn: () => getPostDetails(inReplyToUrl!, { currentUsername }),
    enabled: !!inReplyToUrl,
    staleTime: 60000,
  })

  return (
    <Box
      sx={{
        borderBottom: '1px solid',
        borderColor: 'rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Parent post: "In reply to" - clearly show the parent; click opens parent post detail with this reply below */}
      {inReplyToUrl && (
        <Box
          sx={{
            px: 3,
            pt: 2,
            pb: 1.5,
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            borderLeft: '4px solid',
            borderLeftColor: 'primary.main',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 1,
            }}
          >
            <ReplyIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography component="span" sx={{ fontSize: 14, color: 'primary.main', fontWeight: 700 }}>
              In reply to
            </Typography>
          </Box>
          {parentLoading ? (
            <Box sx={{ py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">Loading original post...</Typography>
            </Box>
          ) : parentPost ? (
            <Box
              onClick={() => navigate(`/post?url=${encodeURIComponent(inReplyToUrl)}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate(`/post?url=${encodeURIComponent(inReplyToUrl)}`)
                }
              }}
              sx={{
                display: 'flex',
                gap: 1.5,
                cursor: 'pointer',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.05)' },
                borderRadius: 1,
                p: 1.5,
                transition: 'background-color 0.2s',
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'primary.main',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {(parentPost.author_username || '?').charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary' }}>
                  {parentPost.author_username}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 14,
                    color: 'text.secondary',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.4,
                    '& a': {
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    },
                  }}
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(parentPost.content, {
                      ALLOWED_TAGS: ['p', 'br', 'a', 'strong', 'em', 'u'],
                      ALLOWED_ATTR: ['href'],
                    }),
                  }}
                />
                <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>
                  {formatRelativeDate(parentPost.created_at)}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography
              component="a"
              href={`/post?url=${encodeURIComponent(inReplyToUrl)}`}
              onClick={(e) => {
                e.preventDefault()
                navigate(`/post?url=${encodeURIComponent(inReplyToUrl)}`)
              }}
              sx={{
                fontSize: 14,
                color: 'primary.main',
                fontWeight: 600,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              View original post
            </Typography>
          )}
        </Box>
      )}

      {/* Your reply */}
      <PostCard
        post={reply}
        authorDisplayName={authorDisplayName}
        authorUsername={authorUsername}
        onReply={onReply}
        onRepost={onRepost}
        onLike={onLike}
        onEdit={onEdit}
        onDelete={onDelete}
        showRepliedToContext={false}
      />
    </Box>
  )
}

