// src/components/admin/FilterBar.tsx
import { Box, TextField, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material'

interface FilterBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  onSearch: () => void
  statusFilter?: {
    value: string
    onChange: (value: string) => void
    options: Array<{ label: string; value: string }>
  }
}

export function FilterBar({
  searchValue,
  onSearchChange,
  onSearch,
  statusFilter,
}: FilterBarProps) {
  return (
    <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
      <TextField
        label='Search'
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        size='small'
        sx={{
          minWidth: 200,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          },
        }}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            onSearch()
          }
        }}
      />
      {statusFilter && (
        <FormControl size='small' sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter.value}
            label='Status'
            onChange={(e) => statusFilter.onChange(e.target.value)}
            sx={{
              borderRadius: 2,
            }}
          >
            {statusFilter.options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      <Button
        variant='outlined'
        onClick={onSearch}
        sx={{
          borderRadius: 25,
          textTransform: 'none',
          fontWeight: 700,
          px: 3,
          color: 'primary.main',
          borderColor: 'primary.main',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
          },
        }}
      >
        Search
      </Button>
    </Box>
  )
}


