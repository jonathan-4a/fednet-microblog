import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'

interface ProtectedRouteProps {
  children: React.ReactElement
  requireAdmin?: boolean
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthContext()

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />
  }

  if (requireAdmin && (!user || !user.isAdmin)) {
    return <Navigate to='/' replace />
  }

  return children
}

