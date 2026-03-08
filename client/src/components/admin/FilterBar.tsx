// src/components/admin/FilterBar.tsx
import { Box, TextField, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { RGBA_COLORS } from '../../constants/theme'

const FILTER_HEIGHT = 40
const INPUT_RADIUS = 1.5
const INPUT_BORDER = 'rgba(0, 0, 0, 0.12)'
const INPUT_BORDER_HOVER = 'rgba(0, 0, 0, 0.2)'

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
    <Box
      sx={{
        mb: 2,
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
        alignItems: 'stretch',
      }}
    >
      <TextField
        label='Search'
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        variant='outlined'
        size='small'
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSearch()
        }}
        sx={{
          width: 220,
          '& .MuiOutlinedInput-root': {
            height: FILTER_HEIGHT,
            borderRadius: INPUT_RADIUS,
            boxShadow: 'none',
            fontSize: 14,
            backgroundColor: '#fff',
            '& fieldset': {
              borderColor: INPUT_BORDER,
              borderWidth: 1,
            },
            '&:hover fieldset': {
              borderColor: INPUT_BORDER_HOVER,
            },
            '&.Mui-focused fieldset': {
              borderColor: 'primary.main',
              borderWidth: 1,
            },
            '&.Mui-focused': { outline: 'none' },
          },
          '& .MuiInputLabel-root': { fontSize: 14 },
        }}
      />
      {statusFilter && (
        <FormControl
          size='small'
          variant='outlined'
          sx={{
            minWidth: 120,
            '& .MuiOutlinedInput-root': {
              height: FILTER_HEIGHT,
              borderRadius: INPUT_RADIUS,
              boxShadow: 'none',
              fontSize: 14,
              backgroundColor: '#fff',
              '& fieldset': {
                borderColor: INPUT_BORDER,
                borderWidth: 1,
              },
              '&:hover fieldset': {
                borderColor: INPUT_BORDER_HOVER,
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
                borderWidth: 1,
              },
              '&.Mui-focused': { outline: 'none' },
            },
            '& .MuiInputLabel-root': { fontSize: 14 },
          }}
        >
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter.value}
            label='Status'
            onChange={(e) => statusFilter.onChange(e.target.value)}
          >
            {statusFilter.options.map((option) => (
              <MenuItem key={option.value} value={option.value} sx={{ fontSize: 14 }}>
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
          height: FILTER_HEIGHT,
          minWidth: 100,
          borderRadius: INPUT_RADIUS,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: 14,
          px: 2,
          color: 'primary.main',
          borderColor: INPUT_BORDER,
          boxShadow: 'none',
          '&:hover': {
            borderColor: INPUT_BORDER_HOVER,
            backgroundColor: RGBA_COLORS.lightHover,
            boxShadow: 'none',
          },
          '&:focus': { outline: 'none' },
          '&:focus-visible': { outline: 'none', borderColor: 'primary.main' },
        }}
      >
        Search
      </Button>
    </Box>
  )
}


