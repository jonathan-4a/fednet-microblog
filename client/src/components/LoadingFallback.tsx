// src/components/LoadingFallback.tsx
import { LoadingSpinner } from './LoadingSpinner'

interface LoadingFallbackProps {
  size?: number
  minHeight?: string | number
  padding?: number | string
}

/**
 * Reusable loading fallback for Suspense boundaries
 * Used for lazy-loaded components and route loading
 */
export function LoadingFallback({
  size,
  minHeight = '200px',
  padding = 2,
}: LoadingFallbackProps) {
  return <LoadingSpinner size={size} minHeight={minHeight} padding={padding} />
}

/**
 * Dialog-specific loading fallback (smaller size)
 */
export function DialogLoadingFallback() {
  return <LoadingSpinner size={24} padding={2} />
}

