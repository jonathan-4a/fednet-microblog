// src/pages/admin/InvitesPage.tsx
import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useAdminInvitesQuery } from '../../hooks/queries/useAdminQueries'
import { useRevokeInviteMutation } from '../../hooks/mutations/useAdminMutations'
import { InvitesTable } from '../../components/admin/InvitesTable'
import { RevokeInviteDialog } from '../../components/admin/RevokeInviteDialog'
import { LoadingSpinner } from '../../components/LoadingSpinner'

export function InvitesPage() {
  const {
    data: invites = [],
    isLoading: loading,
    error,
  } = useAdminInvitesQuery()
  const { mutateAsync: revoke, isPending: revoking } = useRevokeInviteMutation()
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [tokenToRevoke, setTokenToRevoke] = useState<string | null>(null)

  const handleRevokeClick = (token: string) => {
    setTokenToRevoke(token)
    setRevokeDialogOpen(true)
  }

  const handleRevokeConfirm = async () => {
    if (!tokenToRevoke) return
    try {
      await revoke(tokenToRevoke)
      setRevokeDialogOpen(false)
      setTokenToRevoke(null)
    } catch {
      // Error handled by hook
    }
  }

  const handleRevokeCancel = () => {
    setRevokeDialogOpen(false)
    setTokenToRevoke(null)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Box>
      <Typography variant='h5' gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Invite Tokens
      </Typography>

      {error && (
        <Typography color='error' sx={{ mb: 2 }}>
          {error.message}
        </Typography>
      )}

      {invites.length === 0 ? (
        <Box
          sx={{
            mt: 2,
            py: 6,
            textAlign: 'center',
            border: '1px dashed',
            borderColor: 'rgba(0, 0, 0, 0.12)',
            borderRadius: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <Typography variant='body1' color='text.secondary'>
            No invite tokens found
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
            Generate invite tokens to allow new user registrations
          </Typography>
        </Box>
      ) : (
        <InvitesTable invites={invites} onRevoke={handleRevokeClick} />
      )}

      {tokenToRevoke && (
        <RevokeInviteDialog
          open={revokeDialogOpen}
          onClose={handleRevokeCancel}
          onConfirm={handleRevokeConfirm}
          token={tokenToRevoke}
          loading={revoking}
        />
      )}
    </Box>
  )
}

