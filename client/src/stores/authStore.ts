// src/stores/authStore.ts
import { create } from 'zustand'
import { getUserProfile } from '../services/users'
import type { UserProfileOutput } from '../types/user'
import type { QueryClient } from '@tanstack/react-query'

let queryClientRef: QueryClient | null = null


export const setQueryClientRef = (client: QueryClient | null) => {
  queryClientRef = client
}

interface AuthState {
  user: UserProfileOutput | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  setUser: (user: UserProfileOutput | null) => void
  setToken: (token: string | null) => Promise<void>
  initialize: () => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => {
  const clearAuth = () => {
    localStorage.removeItem('token')
    set({ token: null, user: null, isAuthenticated: false, loading: false })
    queryClientRef?.removeQueries()
  }

  const fetchUser = async () => {
    try {
      const user = await getUserProfile()
      set({ user, isAuthenticated: true, loading: false })
      return user
    } catch {
      clearAuth()
      return null
    }
  }

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true,

    setUser: (user) => set({ user, isAuthenticated: !!user }),

    setToken: async (token) => {
      const prevUser = get().user
      if (!token) return clearAuth()

      localStorage.setItem('token', token)
      set({ token, loading: true })

      const user = await fetchUser()
      if (user && prevUser && prevUser.username !== user.username) {
        queryClientRef?.removeQueries()
      }
      set({ token, loading: false })
    },

    initialize: async () => {
      const token = localStorage.getItem('token')
      if (!token) return set({ loading: false })
      set({ token, loading: true })
      await fetchUser()
    },

    logout: clearAuth,
  }
})

