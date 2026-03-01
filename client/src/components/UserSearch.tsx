// src/components/UserSearch.tsx
import {
  Box,
  TextField,
  InputAdornment,
  Paper,
  ClickAwayListener,
  Divider,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserSearch } from '../hooks/useUserSearch'
import { UserCard } from './UserCard'
import { API_BASE } from '../config'

interface UserSearchProps {
  variant: 'dropdown' | 'modal'
  onClose?: () => void
}

export function UserSearch({ variant, onClose }: UserSearchProps) {
  const [query, setQuery] = useState('')
  const [openResults, setOpenResults] = useState(false)
  const { results, setQuery: setSearchQuery, loading } = useUserSearch(1000)
  const navigate = useNavigate()

  const handleResultClick = (username: string) => {
    navigate(`/profile/${username}`)
    setOpenResults(false)
    setQuery('')
    onClose?.()
  }

  const handleRemoteUserClick = () => {
    if (!results.remoteUrl) return

    navigate(`/profile/remote?url=${encodeURIComponent(results.remoteUrl)}`)
    setOpenResults(false)
    setQuery('')
    onClose?.()
  }

  const handleClose = () => {
    setOpenResults(false)
    onClose?.()
  }

  if (variant === 'dropdown') {
    return (
      <ClickAwayListener onClickAway={handleClose}>
        <Box sx={{ position: 'relative', mb: 3 }}>
          <TextField
            size='small'
            fullWidth
            placeholder='Search'
            value={query}
            onFocus={() => setOpenResults(true)}
            onChange={(e) => {
              const val = e.target.value
              setQuery(val)
              setSearchQuery(val)
            }}
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              borderRadius: 25,
              '& .MuiOutlinedInput-root': {
                borderRadius: 25,
                '& fieldset': {
                  border: 'none',
                },
                '&:hover fieldset': {
                  border: 'none',
                },
                '&.Mui-focused fieldset': {
                  border: '1px solid',
                  borderColor: 'primary.main',
                },
                '&.Mui-focused': {
                  backgroundColor: '#fff',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />

          {openResults && query.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1200,
                borderRadius: 2,
                maxHeight: 400,
                overflowY: 'auto',
                mt: 0.5,
                border: '1px solid',
                borderColor: 'rgba(0, 0, 0, 0.08)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                backgroundColor: '#fff',
              }}
            >
              <Box>
                {loading && (
                  <Box
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      color: 'text.secondary',
                    }}
                  >
                    Searching...
                  </Box>
                )}
                {!loading && results.local.length > 0 && (
                  <>
                    {results.local.map((u) => {
                      const domain = new URL(API_BASE).hostname
                      const address = `${u.username}@${domain}`
                      return (
                        <UserCard
                          key={u.username}
                          username={u.username}
                          displayName={u.displayName}
                          address={address}
                          onClick={() => handleResultClick(u.username)}
                        />
                      )
                    })}
                  </>
                )}
                {!loading && results.remoteUsername && results.remoteAddress && (
                  <>
                    {results.local.length > 0 && (
                      <Divider sx={{ my: 0.5, mx: 1 }} />
                    )}
                    <UserCard
                      username={results.remoteUsername}
                      address={results.remoteAddress}
                      onClick={handleRemoteUserClick}
                    />
                  </>
                )}
                {!loading && results.local.length === 0 && !results.remoteUsername && query.length > 0 && (
                  <Box
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      color: 'text.secondary',
                      fontSize: 14,
                    }}
                  >
                    No users found
                  </Box>
                )}
              </Box>
            </Paper>
          )}
        </Box>
      </ClickAwayListener>
    )
  }

  // Modal variant for mobile
  return (
    <ClickAwayListener onClickAway={handleClose}>
      <Box
        onClick={(e) => {
          // Close when clicking the backdrop (dark overlay)
          if (e.target === e.currentTarget) {
            handleClose()
          }
        }}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Paper
          elevation={0}
          onClick={(e) => e.stopPropagation()}
          sx={{
            m: 2,
            borderRadius: 2,
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '1px solid',
            borderColor: 'rgba(0, 0, 0, 0.08)',
          }}
        >
          <Box
            sx={{
              p: 2,
              borderBottom: '1px solid',
              borderColor: 'rgba(0, 0, 0, 0.08)',
            }}
          >
            <TextField
              size='small'
              fullWidth
              placeholder='Search'
              value={query}
              autoFocus
              onChange={(e) => {
                const val = e.target.value
                setQuery(val)
                setSearchQuery(val)
              }}
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: 25,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 25,
                  '& fieldset': {
                    border: 'none',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon
                      sx={{ color: 'text.secondary', fontSize: 20 }}
                    />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          {query.length > 0 && (
            <Box sx={{ p: 0.5 }}>
              {loading && (
                <Box
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    color: 'text.secondary',
                  }}
                >
                  Searching...
                </Box>
              )}
              {!loading && results.local.length > 0 && (
                <>
                  {results.local.map((u) => {
                    const domain = new URL(API_BASE).hostname
                    const address = `${u.username}@${domain}`
                    return (
                      <UserCard
                        key={u.username}
                        username={u.username}
                        displayName={u.displayName}
                        address={address}
                        onClick={() => handleResultClick(u.username)}
                      />
                    )
                  })}
                </>
              )}
              {!loading && results.remoteUsername && results.remoteAddress && (
                <>
                  {results.local.length > 0 && (
                    <Divider sx={{ my: 0.5, mx: 1 }} />
                  )}
                  <UserCard
                    username={results.remoteUsername}
                    address={results.remoteAddress}
                    onClick={handleRemoteUserClick}
                  />
                </>
              )}
              {!loading && results.local.length === 0 && !results.remoteUsername && (
                <Box
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    color: 'text.secondary',
                    fontSize: 14,
                  }}
                >
                  No users found
                </Box>
              )}
            </Box>
          )}
        </Paper>
      </Box>
    </ClickAwayListener>
  )
}

