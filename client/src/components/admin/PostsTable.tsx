// src/components/admin/PostsTable.tsx
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material'
import type { AdminPostSummary } from '../../types/admin'
import { formatDate } from '../../utils/date'
import { BORDER_RADIUS, COLORS, RGBA_COLORS } from '../../constants/theme'

interface PostsTableProps {
  posts: AdminPostSummary[]
  onDelete: (guid: string) => void
}

export function PostsTable({ posts, onDelete }: PostsTableProps) {
  return (
    <TableContainer
      component={Paper}
      sx={{
        border: '1px solid',
        borderColor: RGBA_COLORS.border,
        boxShadow: 'none',
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Author</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Content</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {posts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align='center' sx={{ py: 4 }}>
                No posts found
              </TableCell>
            </TableRow>
          ) : (
            posts.map((post) => (
            <TableRow
              key={post.guid}
              sx={{
                '&:hover': {
                  backgroundColor: RGBA_COLORS.lightHover,
                },
              }}
            >
              <TableCell>{post.author_username}</TableCell>
              <TableCell>
                {post.content.length > 50
                  ? `${post.content.substring(0, 50)}...`
                  : post.content}
              </TableCell>
              <TableCell>{formatDate(post.created_at)}</TableCell>
              <TableCell>
                <Button
                  variant='outlined'
                  size='small'
                  onClick={() => onDelete(post.guid)}
                  sx={{
                    color: COLORS.twitterRed,
                    borderColor: COLORS.twitterRed,
                    border: '1px solid',
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    borderRadius: BORDER_RADIUS.button,
                    px: 2,
                    py: 0.25,
                    minWidth: 70,
                    '&:hover': {
                      borderColor: COLORS.twitterRed,
                      backgroundColor: RGBA_COLORS.redMedium,
                    },
                  }}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

