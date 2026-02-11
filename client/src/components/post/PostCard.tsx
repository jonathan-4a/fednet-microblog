import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import RepeatIcon from '@mui/icons-material/Repeat'
import ReplyIcon from '@mui/icons-material/Reply'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ShareIcon from '@mui/icons-material/Share'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import DOMPurify from 'dompurify'
import type { Post } from '../../types/posts'
import { formatRelativeDate } from '../../utils/date'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuthContext } from '../../hooks/useAuthContext'
import { getProfileUrlFromPost } from '../../utils/user'

interface PostCardProps {
  post: Post
  authorDisplayName?: string
  authorUsername?: string
  onReply?: (post: Post) => void
  onRepost?: (post: Post) => void
  onLike?: (post: Post) => void
  onEdit?: (post: Post) => void
  onDelete?: (post: Post) => void
  clickable?: boolean // If false, post is not clickable (e.g., on detail page)
  /** When true (e.g. in Profile Replies tab), show "Replied to [original post]" with link to original */
  showRepliedToContext?: boolean
}

export function PostCard({
  post,
  authorDisplayName,
  authorUsername,
  onReply,
  onRepost,
  onLike,
  onEdit,
  onDelete,
  clickable = true, // Default to clickable (for lists)
  showRepliedToContext = false,
}: PostCardProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user: currentUser } = useAuthContext()
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [isNavigating, setIsNavigating] = useState(false)

  // Use post's author info if available (for liked posts from different users)
  // Otherwise fall back to props (for user's own posts)
  const displayAuthorUsername = post.author_username || authorUsername

  // Use post's author_name if available, otherwise use prop if it matches, otherwise extract username from handle
  const displayAuthorName =
    post.author_name ||
    (post.author_username &&
    authorUsername === post.author_username &&
    authorDisplayName
      ? authorDisplayName
      : (displayAuthorUsername || '').split('@')[0])

  // Check if current user owns this post
  // Compare both displayAuthorUsername and post.author_username to handle edge cases
  // Also check if username matches without domain (for handles like user@domain.com)
  const currentUsername = currentUser?.username || ''
  const authorUsernameWithoutDomain = (displayAuthorUsername || '').split('@')[0]
  const postAuthorUsernameWithoutDomain = post.author_username?.split('@')[0] || ''
  
  const isOwnPost =
    !post.isRemote && ( // Only allow edit/delete for local posts
      currentUsername === displayAuthorUsername ||
      currentUsername === post.author_username ||
      currentUsername === authorUsernameWithoutDomain ||
      currentUsername === postAuthorUsernameWithoutDomain ||
      (currentUsername === authorUsername && authorUsername === displayAuthorUsername)
    )

  // Only show edit/delete menu if user owns the post AND handlers are provided
  const showEditDeleteMenu = isOwnPost && (onEdit || onDelete)

  const handleReply = () => {
    onReply?.(post)
  }

  const handleRepost = () => {
    onRepost?.(post)
  }

  const handleLike = () => {
    onLike?.(post)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setMenuAnchor(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
  }

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation()
    handleMenuClose()
    onEdit?.(post)
  }

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation()
    handleMenuClose()
    onDelete?.(post)
  }

  const handlePostClick = () => {
    if (!clickable) return // Don't navigate if not clickable
    if (isNavigating) return

    // Use noteId for all posts (local and remote) - consistent URL format
    if (post.noteId) {
      const targetPath = `/post?url=${encodeURIComponent(post.noteId)}`
      const currentPath = location.pathname + location.search
      if (currentPath === targetPath) return
      setIsNavigating(true)
      navigate(targetPath)
      setTimeout(() => setIsNavigating(false), 500)
      return
    }

    // Fallback: if noteId is missing, construct from username/guid
    const username = post.author_username || authorUsername
    const guid = post.guid

    if (!username || !guid) {
      return
    }

    // Construct noteId from username and guid for local posts
    const fallbackNoteId = `${window.location.origin}/u/${username}/statuses/${guid}`
    const targetPath = `/post?url=${encodeURIComponent(fallbackNoteId)}`
    const currentPath = location.pathname + location.search
    if (currentPath === targetPath) return

    setIsNavigating(true)
    navigate(targetPath)
    setTimeout(() => setIsNavigating(false), 500)
  }

  const handleBoxClick = (event: React.MouseEvent) => {
    // Don't navigate when clicking links in post content - let them open normally
    if ((event.target as HTMLElement).closest('a')) return
    handlePostClick()
  }

  return (
    <Box
      onClick={clickable ? handleBoxClick : undefined}
      sx={{
        // Only show border-bottom when clickable (in lists), not on detail page
        ...(clickable && {
          borderBottom: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.08)',
        }),
        px: 3,
        py: 3,
        // Always show hover effect (even when not clickable)
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        },
        transition: 'background-color 0.2s',
        // Only show pointer cursor when clickable
        ...(clickable && {
          cursor: 'pointer',
        }),
      }}
    >
      {post.isRepost && post.repostedBy && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <RepeatIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography component="span" sx={{ fontSize: 13, color: 'text.secondary' }}>
            Reposted by{' '}
            <Typography
              component="a"
              href={post.repostedBy.startsWith('http') ? `/profile/remote?url=${encodeURIComponent(post.repostedBy)}` : `/${post.repostedBy}`}
              onClick={(e) => {
                e.stopPropagation()
                if (post.repostedBy?.startsWith('http')) {
                  navigate(`/profile/remote?url=${encodeURIComponent(post.repostedBy)}`)
                } else {
                  navigate(`/${post.repostedBy}`)
                }
              }}
              sx={{ fontWeight: 600, color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              {post.repostedBy.split('/').filter(Boolean).pop() || post.repostedBy}
            </Typography>
          </Typography>
        </Box>
      )}
      {showRepliedToContext && post.inReplyTo && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <ReplyIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography component="span" sx={{ fontSize: 13, color: 'text.secondary' }}>
            Replied to{' '}
            <Typography
              component="a"
              href={`/post?url=${encodeURIComponent(post.inReplyTo)}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                navigate(`/post?url=${encodeURIComponent(post.inReplyTo!)}`)
              }}
              sx={{ fontWeight: 600, color: 'primary.main', textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              {(() => {
                const m = post.inReplyTo?.match(/\/u\/([^/#?]+)(?:\/statuses\/|#)/)
                return m ? `@${m[1]}` : 'this post'
              })()}
            </Typography>
          </Typography>
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'primary.main',
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {displayAuthorUsername?.charAt(0).toUpperCase() || '?'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 0.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                component="a"
                href={getProfileUrlFromPost(displayAuthorUsername || '', post.noteId, post.raw_message)}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  navigate(getProfileUrlFromPost(displayAuthorUsername || '', post.noteId, post.raw_message))
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
                {formatRelativeDate(post.created_at)}
              </Typography>
            </Box>
            {showEditDeleteMenu && (
              <>
                <IconButton
                  size='small'
                  onClick={handleMenuOpen}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    },
                  }}
                >
                  <MoreVertIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={handleMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  {onEdit && (
                    <MenuItem onClick={handleEdit}>
                      <EditIcon sx={{ fontSize: 18, mr: 1 }} />
                      Edit
                    </MenuItem>
                  )}
                  {onDelete && (
                    <MenuItem
                      onClick={handleDelete}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon sx={{ fontSize: 18, mr: 1 }} />
                      Delete
                    </MenuItem>
                  )}
                </Menu>
              </>
            )}
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
              __html: DOMPurify.sanitize(post.content, {
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
            {post.repliesCount !== undefined && post.repliesCount > 0 && (
              <Typography
                sx={{
                  fontSize: 13,
                  color: 'text.secondary',
                  ml: -3,
                }}
              >
                {post.repliesCount}
              </Typography>
            )}

            <Tooltip title='Repost'>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation()
                  handleRepost()
                }}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: '#00ba7c',
                    backgroundColor: 'rgba(0, 186, 124, 0.1)',
                  },
                  transition: 'all 0.2s',
                }}
                size='small'
              >
                <RepeatIcon sx={{ fontSize: 18.75 }} />
              </IconButton>
            </Tooltip>
            {post.sharesCount !== undefined && post.sharesCount > 0 && (
              <Typography
                sx={{
                  fontSize: 13,
                  color: 'text.secondary',
                  ml: -3,
                }}
              >
                {post.sharesCount}
              </Typography>
            )}

            <Tooltip title={post.isLiked ? 'Unlike' : 'Like'}>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation()
                  handleLike()
                }}
                sx={{
                  color: post.isLiked ? '#f4212e' : 'text.secondary',
                  '&:hover': {
                    color: '#f4212e',
                    backgroundColor: 'rgba(244, 33, 46, 0.1)',
                  },
                  transition: 'all 0.2s',
                }}
                size='small'
              >
                {post.isLiked ? (
                  <FavoriteIcon sx={{ fontSize: 18.75 }} />
                ) : (
                  <FavoriteBorderIcon sx={{ fontSize: 18.75 }} />
                )}
              </IconButton>
            </Tooltip>
            {post.likesCount !== undefined && post.likesCount > 0 && (
              <Typography
                sx={{
                  fontSize: 13,
                  color: post.isLiked ? '#f4212e' : 'text.secondary',
                  ml: -3,
                }}
              >
                {post.likesCount}
              </Typography>
            )}

            <Tooltip title='Share'>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation()
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
                <ShareIcon sx={{ fontSize: 18.75 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}


