// src/services/auth.ts
import { apiRequest } from './apiClient'
import { useAuthStore } from '../stores/authStore'
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
} from '../types/auth'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

// POST /api/auth/register
export async function register(
  data: RegisterRequest
): Promise<RegisterResponse> {
  const response = (await apiRequest(
    '/api/auth/register',
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }
  )) as RegisterResponse | undefined
  if (!response) throw new Error('No response from server')
  return response
}

// POST /api/auth/login
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = (await apiRequest(
    '/api/auth/login',
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }
  )) as LoginResponse | undefined
  if (!response) throw new Error('No response from server')
  return response
}

// POST /api/auth/logout
export async function logout(): Promise<LogoutResponse> {
  const token = useAuthStore.getState().token
  const headers: Record<string, string> = { ...JSON_HEADERS }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = (await apiRequest(
    '/api/auth/logout',
    { method: 'POST', headers }
  )) as LogoutResponse | undefined
  if (!response) throw new Error('No response from server')
  return response
}

