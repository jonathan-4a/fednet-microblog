// src/components/admin/InvitesTable.tsx
import { useState } from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Button,
  IconButton,
} from '@mui/material'
import { ContentCopy as ContentCopyIcon } from '@mui/icons-material'
import { SnackbarNotification } from '../SnackbarNotification'
import { copyToClipboard } from '../../utils/clipboard'
import { formatTimestamp } from '../../utils/date'
import type { InviteTokenRecord } from '../../types/admin'
import { BORDER_RADIUS, COLORS, RGBA_COLORS } from '../../constants/theme'

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
    <>
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
          '& .MuiIconButton-root': { '&:focus': { outline: 'none' }, '&:focus-visible': { outline: 'none' } },
        }}
      >
        <Table size='small'>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'transparent' }}>
              <TableCell sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', py: 1.5 }}>Token</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', py: 1.5 }}>Created By</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', py: 1.5 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', py: 1.5 }}>Used By</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', py: 1.5 }}>Created At</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', py: 1.5 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align='center' sx={{ py: 4, fontSize: 14, color: 'text.secondary', borderBottom: 'none' }}>
                  No invite tokens found
                </TableCell>
              </TableRow>
            ) : (
              invites.map((invite) => (
                <TableRow key={invite.token} sx={{ '&:hover': { backgroundColor: RGBA_COLORS.lightHover } }}>
                  <TableCell sx={{ fontSize: 14, py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {invite.token.substring(0, 16)}...
                      </Typography>
                      <IconButton
                        size='small'
                        onClick={() => handleCopy(invite.token)}
                        sx={{
                          color: 'text.secondary',
                          padding: 0.25,
                          '& .MuiSvgIcon-root': { fontSize: 14 },
                          '&:hover': { backgroundColor: RGBA_COLORS.hover },
                        }}
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: 14, py: 1.5 }}>{invite.created_by || '-'}</TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Chip label={invite.status} color={getStatusColor(invite.status) as 'success' | 'default' | 'error'} size='small' sx={{ fontSize: 11, height: 20 }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: 14, py: 1.5 }}>{invite.used_by || '-'}</TableCell>
                  <TableCell sx={{ fontSize: 14, py: 1.5 }}>{formatTimestamp(invite.created_at)}</TableCell>
                  <TableCell sx={{ py: 1 }}>
                    {invite.status === 'unused' && (
                      <Button
                        variant='outlined'
                        size='small'
                        onClick={() => onRevoke(invite.token)}
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
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>
      <SnackbarNotification
        open={copiedToken !== null}
        message='Token copied to clipboard'
        severity='success'
        onClose={() => setCopiedToken(null)}
        autoHideDuration={2000}
      />
    </>
  )
}

