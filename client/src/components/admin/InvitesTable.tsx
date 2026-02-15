import { useState } from 'react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Button,
  IconButton,
  Box,
} from '@mui/material'
import { ContentCopy as ContentCopyIcon } from '@mui/icons-material'
import { SnackbarNotification } from '../SnackbarNotification'
import { copyToClipboard } from '../../utils/clipboard'
import { formatTimestamp } from '../../utils/date'
import type { InviteTokenRecord } from '../../types/admin'

interface InvitesTableProps {
  invites: InviteTokenRecord[]
  onRevoke: (token: string) => void
}

export function InvitesTable({ invites, onRevoke }: InvitesTableProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unused':
        return 'success'
      case 'used':
        return 'default'
      case 'revoked':
        return 'error'
      default:
        return 'default'
    }
  }

  const handleCopy = async (token: string) => {
    const success = await copyToClipboard(token)
    if (success) {
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 2000)
    }
  }

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
            <TableCell sx={{ fontWeight: 700 }}>Token</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Created By</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Used By</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Created At</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invites.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align='center' sx={{ py: 4 }}>
                No invite tokens found
              </TableCell>
            </TableRow>
          ) : (
            invites.map((invite) => (
            <TableRow
              key={invite.token}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                },
              }}
            >
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant='body2' sx={{ fontFamily: 'monospace' }}>
                    {invite.token.substring(0, 16)}...
                  </Typography>
                  <IconButton
                    size='small'
                    onClick={() => handleCopy(invite.token)}
                    sx={{
                      color: 'text.secondary',
                      padding: 0.5,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      },
                    }}
                  >
                    <ContentCopyIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </TableCell>
              <TableCell>{invite.created_by || '-'}</TableCell>
              <TableCell>
                <Chip
                  label={invite.status}
                  color={
                    getStatusColor(invite.status) as
                      | 'success'
                      | 'default'
                      | 'error'
                  }
                  size='small'
                />
              </TableCell>
              <TableCell>{invite.used_by || '-'}</TableCell>
              <TableCell>{formatTimestamp(invite.created_at)}</TableCell>
              <TableCell>
                {invite.status === 'unused' && (
                  <Button
                    variant='outlined'
                    size='small'
                    onClick={() => onRevoke(invite.token)}
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
                )}
              </TableCell>
            </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <SnackbarNotification
        open={copiedToken !== null}
        message='Token copied to clipboard'
        severity='success'
        onClose={() => setCopiedToken(null)}
        autoHideDuration={2000}
      />
    </TableContainer>
  )
}

