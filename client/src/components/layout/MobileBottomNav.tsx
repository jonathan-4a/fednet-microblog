import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import PersonIcon from '@mui/icons-material/Person'
import SearchIcon from '@mui/icons-material/Search'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../hooks/useAuthContext'
import { useState } from 'react'
import { UserSearch } from '../UserSearch'

export function MobileBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAuthContext()
  const [, setValue] = useState(0)
  const [showSearch, setShowSearch] = useState(false)

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
    if (newValue === 0) {
      navigate('/')
    } else if (newValue === 1 && user) {
      navigate(`/profile/${user.username}`)
    } else if (newValue === 2) {
      setShowSearch(true)
    }
  }

  const handleCloseSearch = () => {
    setShowSearch(false)
    setValue(0)
  }

  if (!isAuthenticated) {
    return null
  }

  // Determine current value based on location and search state
  let currentValue = 0
  if (showSearch) {
    currentValue = 2
  } else if (location.pathname.startsWith('/profile')) {
    currentValue = 1
  }

  return (
    <>
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          borderTop: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.08)',
        }}
        elevation={0}
      >
        <BottomNavigation
          value={currentValue}
          onChange={handleChange}
          showLabels
        >
          <BottomNavigationAction label='Home' icon={<HomeIcon />} />
          <BottomNavigationAction label='Profile' icon={<PersonIcon />} />
          <BottomNavigationAction label='Search' icon={<SearchIcon />} />
        </BottomNavigation>
      </Paper>

      {showSearch && <UserSearch variant='modal' onClose={handleCloseSearch} />}
    </>
  )
}


