// src/hooks/useDeleteAccount.ts
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteAccount as deleteAccountService } from '../services/users'
import { useAuthStore } from '../stores/authStore'

export function useDeleteAccount() {
  const [loading, setLoading] = useState(false)
  const setToken = useAuthStore((state) => state.setToken)
  const setUser = useAuthStore((state) => state.setUser)
  const navigate = useNavigate()

  const deleteAccount = async (): Promise<void> => {
    setLoading(true)
    try {
      await deleteAccountService()
      // Clear user data immediately (setToken handles localStorage)
      setToken(null)
      setUser(null)
      // Navigate to login page
      navigate('/login', { replace: true })
    } catch (err) {
      setLoading(false)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    deleteAccount,
    loading,
  }
}

