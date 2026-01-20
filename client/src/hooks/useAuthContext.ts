import { useAuthStore } from '../stores/authStore'

export function useAuthContext() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setUser = useAuthStore((state) => state.setUser)
  const setToken = useAuthStore((state) => state.setToken)

  return {
    user,
    token,
    isAuthenticated,
    setUser,
    setToken,
  }
}


