// src/routes/auth.tsx
import { lazy } from 'react'

const RegisterPage = lazy(() => import('../pages/RegisterPage').then(module => ({ default: module.RegisterPage })))
const LoginPage = lazy(() => import('../pages/LoginPage').then(module => ({ default: module.LoginPage })))

export const authRoutes = [
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
]


