// src/components/admin/StatsStrip.tsx
import { Box, Typography } from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import PersonIcon from '@mui/icons-material/Person'
import PersonOffIcon from '@mui/icons-material/PersonOff'
import ArticleIcon from '@mui/icons-material/Article'

export interface StatsStripItem {
  label: string
  value: number
}

const getIcon = (label: string) => {
  if (label.includes('Total Users')) return <PeopleIcon sx={{ fontSize: 16 }} />
  if (label.includes('Active Users')) return <PersonIcon sx={{ fontSize: 16 }} />
  if (label.includes('Inactive Users')) return <PersonOffIcon sx={{ fontSize: 16 }} />
  if (label.includes('Posts')) return <ArticleIcon sx={{ fontSize: 16 }} />
  return null
}

const getColor = (label: string) => {
  if (label.includes('Active Users')) return 'primary.main'
  if (label.includes('Inactive Users')) return 'error.main'
  if (label.includes('Posts')) return 'success.main'
  return 'text.primary'
}

interface StatsStripProps {
  items: StatsStripItem[]
}

export function StatsStrip({ items }: StatsStripProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
        gap: 2,
      }}
    >
      {items.map((item) => {
        const icon = getIcon(item.label)
        const color = getColor(item.label)
        return (
          <Box
            key={item.label}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              p: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
              borderRadius: 2,
            }}
          >
            {icon && (
              <Box sx={{ color, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {icon}
              </Box>
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500, lineHeight: 1.3 }}>
                {item.label}
              </Typography>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1.3 }}>
                {item.value}
              </Typography>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
