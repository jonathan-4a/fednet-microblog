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
      <Typography
        sx={{
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'text.primary',
          mb: 2,
        }}
      >
        Invite tokens
      </Typography>

      {error && (
        <Typography color='error' sx={{ mb: 2 }}>
          {error.message}
        </Typography>
      )}

      {invites.length === 0 ? (
        <Box
          sx={{
            mt: 1.5,
            py: 4,
            textAlign: 'center',
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'rgba(0, 0, 0, 0.12)',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            No invite tokens found
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5, fontSize: 12 }}>
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

