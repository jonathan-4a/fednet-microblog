// src/components/profile/TabPanel.tsx
import { Box } from '@mui/material'

interface TabPanelProps {
  children?: React.ReactNode
  value: number
  index: number
}

export function TabPanel({ children, value, index }: TabPanelProps) {
  const visible = value === index
  return (
    <div
      role="tabpanel"
      hidden={!visible}
      style={{
        display: visible ? 'block' : 'none',
      }}
    >
      <Box
        sx={{
          py: 3,
          animation: visible ? 'tabPanelIn 180ms ease' : 'none',
          '@keyframes tabPanelIn': {
            from: { opacity: 0, transform: 'translateY(4px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        {children}
      </Box>
    </div>
  )
}


