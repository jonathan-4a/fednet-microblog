// src/components/AuthInitializer.tsx
import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { LoadingFallback } from './LoadingFallback'

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize)
  const loading = useAuthStore((state) => state.loading)

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return <LoadingFallback minHeight="100vh" />
  }

  return <>{children}</>
}


