import { Paper, Typography, Box } from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import PersonIcon from '@mui/icons-material/Person'
import PersonOffIcon from '@mui/icons-material/PersonOff'
import ArticleIcon from '@mui/icons-material/Article'

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
        border: '1px solid',
        borderColor: 'rgba(0, 0, 0, 0.08)',
        boxShadow: 'none',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        {icon && (
          <Box
            sx={{
              color,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {icon}
          </Box>
        )}
        <Typography variant='body2' color='text.secondary' sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
      </Box>
      <Typography
        variant='h4'
        sx={{
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </Typography>
    </Paper>
  )
}


