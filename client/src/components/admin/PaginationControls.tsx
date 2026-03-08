// src/components/admin/PaginationControls.tsx
import { Box, Pagination } from '@mui/material'
import type { Pagination as PaginationType } from '../../types/admin'
import { BORDER_RADIUS, RGBA_COLORS } from '../../constants/theme'

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
        size='small'
        count={pagination.pages}
        page={page}
        onChange={(_, value) => onPageChange(value)}
        sx={{
          '& .MuiPaginationItem-root': {
            borderRadius: BORDER_RADIUS.card,
            fontWeight: 600,
            fontSize: 13,
            minWidth: 28,
            height: 28,
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: '#fff',
            },
            '&:hover': {
              backgroundColor: RGBA_COLORS.lightHover,
            },
          },
        }}
      />
    </Box>
  )
}


