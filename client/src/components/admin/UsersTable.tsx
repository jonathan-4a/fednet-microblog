// src/components/admin/UsersTable.tsx
import { Link } from 'react-router-dom'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Switch,
  Button,
} from '@mui/material'
import type { AdminUserListItem } from '../../types/admin'
import { BORDER_RADIUS, COLORS, RGBA_COLORS } from '../../constants/theme'

interface UsersTableProps {
  users: AdminUserListItem[]
  onToggleActive: (username: string, currentStatus: boolean) => void
  onDelete: (username: string) => void
}

export function UsersTable({ users, onToggleActive, onDelete }: UsersTableProps) {
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
        '& .MuiSwitch-root': { '& .Mui-focusVisible': { outline: 'none' } },
        '& .MuiButton-root': { '&:focus': { outline: 'none' }, '&:focus-visible': { outline: 'none' } },
      }}
    >
      <Table size='small'>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'transparent' }}>
            <TableCell sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', py: 1.5 }}>Username</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', py: 1.5 }}>Display Name</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', py: 1.5 }}>Active</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', py: 1.5 }}>Admin</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', py: 1.5 }}>Posts</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', py: 1.5 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align='center' sx={{ py: 4, fontSize: 14, color: 'text.secondary', borderBottom: 'none' }}>
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.username} sx={{ '&:hover': { backgroundColor: RGBA_COLORS.lightHover } }}>
                <TableCell sx={{ fontSize: 14, py: 1.5 }}>
                  {user.username.includes('://') ? (
                    <Link
                      to={`/profile/remote?url=${encodeURIComponent(user.username)}`}
                      style={{ color: 'inherit', fontWeight: 600, textDecoration: 'none' }}
                    >
                      {user.username}
                    </Link>
                  ) : (
                    <Link
                      to={`/profile/${user.username}`}
                      style={{ color: 'inherit', fontWeight: 600, textDecoration: 'none' }}
                    >
                      {user.username}
                    </Link>
                  )}
                </TableCell>
                <TableCell sx={{ fontSize: 14, py: 1.5 }}>{user.display_name || '-'}</TableCell>
                <TableCell sx={{ py: 1 }}>
                  <Switch
                    size='small'
                    checked={user.is_active}
                    onChange={() => onToggleActive(user.username, user.is_active)}
                    color='primary'
                  />
                </TableCell>
                <TableCell sx={{ fontSize: 14, py: 1.5 }}>{user.is_admin ? 'Yes' : 'No'}</TableCell>
                <TableCell sx={{ fontSize: 14, py: 1.5 }}>{user.post_count}</TableCell>
                <TableCell sx={{ py: 1 }}>
                  <Button
                    variant='outlined'
                    size='small'
                    onClick={() => onDelete(user.username)}
                    sx={{
                      color: COLORS.danger,
                      borderColor: COLORS.danger,
                      textTransform: 'none',
                      fontSize: 13,
                      fontWeight: 600,
                      borderRadius: BORDER_RADIUS.button,
                      px: 1.5,
                      py: 0.4,
                      minWidth: 56,
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: COLORS.danger,
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


