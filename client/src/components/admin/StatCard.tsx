// src/components/admin/StatCard.tsx
import { Paper, Typography, Box } from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import PersonIcon from '@mui/icons-material/Person'
import PersonOffIcon from '@mui/icons-material/PersonOff'
import ArticleIcon from '@mui/icons-material/Article'
import { BORDER_RADIUS, RGBA_COLORS } from '../../constants/theme'

interface StatCardProps {
  label: string
  value: number | string
  variant?: 'default' | 'active' | 'inactive' | 'posts'
}

const getIcon = (label: string) => {
  if (label.includes('Total Users')) return <PeopleIcon />
  if (label.includes('Active Users')) return <PersonIcon />
  if (label.includes('Inactive Users')) return <PersonOffIcon />
  if (label.includes('Posts')) return <ArticleIcon />
  return null
}

const getColor = (label: string) => {
  if (label.includes('Active Users')) return 'primary.main'
  if (label.includes('Inactive Users')) return 'error.main'
  if (label.includes('Posts')) return 'success.main'
  return 'text.primary'
}

export function StatCard({ label, value }: StatCardProps) {
  const icon = getIcon(label)
  const color = getColor(label)

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: BORDER_RADIUS.card,
        border: '1px solid',
        borderColor: RGBA_COLORS.border,
        boxShadow: 'none',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        {icon && (
          <Box sx={{ color, display: 'flex', alignItems: 'center' }}>
            {icon}
          </Box>
        )}
        <Typography variant='body2' color='text.secondary' sx={{ fontWeight: 500, fontSize: 13 }}>
          {label}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 20, fontWeight: 700, color }}>
        {value}
      </Typography>
    </Paper>
  )
}


