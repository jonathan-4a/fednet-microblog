import { Box, Pagination } from '@mui/material'
import type { Pagination as PaginationType } from '../../types/admin'

interface PaginationControlsProps {
  pagination: PaginationType | null
  page: number
  onPageChange: (page: number) => void
}

export function PaginationControls({
  pagination,
  page,
  onPageChange,
}: PaginationControlsProps) {
  if (!pagination || pagination.pages <= 1) return null

  return (
    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
      <Pagination
        count={pagination.pages}
        page={page}
        onChange={(_, value) => onPageChange(value)}
      />
    </Box>
  )
}


