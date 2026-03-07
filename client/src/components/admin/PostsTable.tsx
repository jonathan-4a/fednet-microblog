// src/components/admin/PostsTable.tsx
import {
  Box,
  Table,
  TableBody,
  TableCell,
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
    <Box
      sx={{
        overflow: 'auto',
        borderRadius: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        boxShadow: 'none',
        '& .MuiTableRow-root': {
          '&:hover': { outline: 'none', boxShadow: 'none' },
          '&:focus': { outline: 'none' },
          '&:focus-within': { outline: 'none' },
        },
        '& .MuiTableCell-root': {
          borderBottom: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.06)',
          '&:focus': { outline: 'none' },
          '&:focus-within': { outline: 'none' },
        },
        '& .MuiButton-root': { '&:focus': { outline: 'none' }, '&:focus-visible': { outline: 'none' } },
      }}
    >
      <Table size='small'>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'transparent' }}>
            <TableCell sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', py: 1.5 }}>Author</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', py: 1.5 }}>Content</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', py: 1.5 }}>Created</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', py: 1.5 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {posts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align='center' sx={{ py: 4, fontSize: 14, color: 'text.secondary', borderBottom: 'none' }}>
                No posts found
              </TableCell>
            </TableRow>
          ) : (
            posts.map((post) => (
              <TableRow key={post.guid} sx={{ '&:hover': { backgroundColor: RGBA_COLORS.lightHover } }}>
                <TableCell sx={{ fontSize: 14, py: 1.5 }}>{post.author_username}</TableCell>
                <TableCell sx={{ fontSize: 14, py: 1.5 }}>
                  {post.content.length > 50 ? `${post.content.substring(0, 50)}...` : post.content}
                </TableCell>
                <TableCell sx={{ fontSize: 14, py: 1.5 }}>{formatDate(post.created_at)}</TableCell>
                <TableCell sx={{ py: 1 }}>
                  <Button
                    variant='outlined'
                    size='small'
                    onClick={() => onDelete(post.guid)}
                    sx={{
                      color: COLORS.twitterRed,
                      borderColor: COLORS.twitterRed,
                      textTransform: 'none',
                      fontSize: 13,
                      fontWeight: 600,
                      borderRadius: BORDER_RADIUS.button,
                      px: 1.5,
                      py: 0.4,
                      minWidth: 56,
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: COLORS.twitterRed,
                        backgroundColor: RGBA_COLORS.redMedium,
                        boxShadow: 'none',
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
    </Box>
  )
}

