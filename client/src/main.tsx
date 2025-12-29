import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'
import App from './App.tsx'
import { AuthInitializer } from './components/AuthInitializer'
import { setQueryClientRef } from './stores/authStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
})

setQueryClientRef(queryClient)

const theme = createTheme({
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: 15,
    h1: { fontSize: 20, fontWeight: 700 },
    h2: { fontSize: 20, fontWeight: 700 },
    h3: { fontSize: 20, fontWeight: 700 },
    h4: { fontSize: 20, fontWeight: 700 },
    h5: { fontSize: 20, fontWeight: 700 },
    h6: { fontSize: 20, fontWeight: 700 },
    body1: { fontSize: 15 },
    body2: { fontSize: 13 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  spacing: 8,
  palette: {
    primary: { main: '#1DA1F2' },
    background: { default: '#fff' },
    text: {
      primary: '#0f1419',
      secondary: '#536471',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.08)',
          backgroundColor: '#fff',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 25,
          textTransform: 'none',
          fontWeight: 700,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            boxShadow: 'none',
          },
        },
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AuthInitializer>
          <App />
        </AuthInitializer>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  </BrowserRouter>
)

