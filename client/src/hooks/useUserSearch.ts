// src/hooks/useUserSearch.ts
import { useState, useEffect, useRef } from 'react'
import { useUserSearchQuery } from './queries/useUserSearchQuery'
import { useAuthContext } from './useAuthContext'

export function useUserSearch(debounceMs = 1000) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const timerRef = useRef<number | null>(null)
  const { user } = useAuthContext()

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }

    timerRef.current = window.setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [query, debounceMs])

  const {
    data: results,
    isLoading: loading,
    error,
  } = useUserSearchQuery(debouncedQuery, user?.username)

  return {
    query,
    setQuery,
    results: results ?? { local: [] },
    loading,
    error: error?.message ?? null,
  }
}

