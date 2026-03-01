// src/hooks/useAuth.ts
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  register as registerService,
  login as loginService,
  logout as logoutService,
} from '../services/auth'
import { useAuthStore } from '../stores/authStore'
import type { RegisterRequest, LoginRequest } from '../types/auth'

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return (err as { message: string }).message
  }
  return fallback
}

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { setToken, logout: clearAuth } = useAuthStore()

  const register = async (data: RegisterRequest) => {
    setLoading(true)
    setError(null)
    try {
      await registerService(data)
      navigate('/login')
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed'))
      throw err
    } finally {
      setLoading(false)
    }
  }

  const login = async (data: LoginRequest) => {
    setLoading(true)
    setError(null)
    try {
      const response = await loginService(data)
      await setToken(response.token)
      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed'))
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    setError(null)
    try {
      await logoutService()
      clearAuth()
      navigate('/login')
    } catch (err) {
      setError(getErrorMessage(err, 'Logout failed'))
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { register, login, logout, loading, error }
}

