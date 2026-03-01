// src/components/post/ReplyThread.tsx
import { Box } from '@mui/material'
import { ReplyCard } from './ReplyCard'
import type { Post } from '../../types/posts'

interface ReplyThreadProps {
  replies: Post[]
  authorDisplayName?: string
  authorUsername: string
  onReply?: (post: Post) => void
  onLike?: (post: Post) => void
}

export function ReplyThread({
  replies,
  authorDisplayName,
  authorUsername,
  onReply,
  onLike,
}: ReplyThreadProps) {
  if (replies.length === 0) {
    return null
  }

  return (
    <Box>
      {replies.map((reply) => (
        <ReplyCard
          key={reply.noteId || reply.guid}
          reply={reply}
          authorDisplayName={authorDisplayName}
          authorUsername={authorUsername}
          onReply={onReply}
          onLike={onLike}
        />
      ))}
    </Box>
  )
}


