import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useAdminUsersQuery } from '../../hooks/queries/useAdminQueries'
import {
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '../../hooks/mutations/useAdminMutations'
import { FilterBar } from '../../components/admin/FilterBar'
import { UsersTable } from '../../components/admin/UsersTable'
import { PaginationControls } from '../../components/admin/PaginationControls'
import { LoadingSpinner } from '../../components/LoadingSpinner'

export function UsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')

  const {
    data: usersData,
    isLoading: loading,
    error,
    refetch,
  } = useAdminUsersQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: status !== 'all' ? status : undefined,
  })

  const updateUser = useUpdateUserMutation()
  const deleteUser = useDeleteUserMutation()

  const users = usersData?.users || []
  const pagination = usersData?.pagination || null

  const handleSearch = () => {
    setPage(1)
    refetch()
  }

  const handleToggleActive = async (
    username: string,
    currentStatus: boolean
  ) => {
    try {
      await updateUser.mutateAsync({
        username,
        data: { is_active: !currentStatus },
      })
    } catch {
      // Error handled by hook
    }
  }

  const handleDelete = async (username: string) => {
    if (!confirm(`Delete user ${username}?`)) return
    try {
      await deleteUser.mutateAsync(username)
    } catch {
      // Error handled by hook
    }
  }

  if (loading && !users.length) {
    return <LoadingSpinner />
  }

  return (
    <Box>
      <Typography variant='h5' gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Users
      </Typography>

      {error && (
        <Typography color='error' sx={{ mb: 2 }}>
          {error.message}
        </Typography>
      )}

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        onSearch={handleSearch}
        statusFilter={{
          value: status,
          onChange: (value) => {
            setStatus(value as 'all' | 'active' | 'inactive')
            setPage(1)
          },
          options: [
            { label: 'All', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ],
        }}
      />

      {users.length === 0 && !loading ? (
        <Box
          sx={{
            mt: 4,
            py: 6,
            textAlign: 'center',
            border: '1px dashed',
            borderColor: 'rgba(0, 0, 0, 0.12)',
            borderRadius: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <Typography variant='body1' color='text.secondary'>
            No users found
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
            {search
              ? `No users found matching "${search}"`
              : status !== 'all'
              ? `No ${status} users found`
              : 'There are no users in the system yet'}
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ mt: 3 }}>
            <UsersTable
              users={users}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          </Box>
          <PaginationControls
            pagination={pagination}
            page={page}
            onPageChange={setPage}
          />
        </>
      )}
    </Box>
  )
}

