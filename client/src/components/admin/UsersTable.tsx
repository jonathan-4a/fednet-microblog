import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Button,
} from '@mui/material'
import type { AdminUserListItem } from '../../types/admin'

interface UsersTableProps {
  users: AdminUserListItem[]
  onToggleActive: (username: string, currentStatus: boolean) => void
  onDelete: (username: string) => void
}

export function UsersTable({ users, onToggleActive, onDelete }: UsersTableProps) {
  return (
    <TableContainer
      component={Paper}
      sx={{
        border: '1px solid',
        borderColor: 'rgba(0, 0, 0, 0.08)',
        boxShadow: 'none',
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Display Name</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Active</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Admin</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Posts</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align='center' sx={{ py: 4 }}>
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
            <TableRow
              key={user.username}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                },
              }}
            >
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.display_name || '-'}</TableCell>
              <TableCell>
                <Switch
                  checked={user.is_active}
                  onChange={() => onToggleActive(user.username, user.is_active)}
                  color='primary'
                />
              </TableCell>
              <TableCell>{user.is_admin ? 'Yes' : 'No'}</TableCell>
              <TableCell>{user.post_count}</TableCell>
              <TableCell>
                <Button
                  variant='outlined'
                  size='small'
                  onClick={() => onDelete(user.username)}
                  sx={{
                    color: '#f4212e',
                    borderColor: '#f4212e',
                    border: '1px solid',
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    borderRadius: 25,
                    px: 2,
                    py: 0.25,
                    minWidth: 70,
                    '&:hover': {
                      borderColor: '#f4212e',
                      backgroundColor: 'rgba(244, 33, 46, 0.1)',
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


