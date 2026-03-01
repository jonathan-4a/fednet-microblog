// src/routes/index.tsx
import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { authRoutes } from './auth'
import { adminRoutes } from './admin'
import { userRoutes, publicUserRoutes } from './user'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { LoadingFallback } from '../components/LoadingFallback'
import { useAuthStore } from '../stores/authStore'
import { NotFoundPage } from '../pages/PageNotFound'

const HomePage = lazy(() =>
  import('../pages/HomePage').then((module) => ({ default: module.HomePage }))
)

const LandingPage = lazy(() =>
  import('../pages/LandingPage').then((module) => ({
    default: module.LandingPage,
  }))
)


function RootRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <HomePage /> : <LandingPage />
}

interface RouteConfig {
  path: string
  element: React.ReactElement
  requireAuth?: boolean
  requireAdmin?: boolean
}

function wrapRoute(
  element: React.ReactElement,
  options: { requireAuth?: boolean; requireAdmin?: boolean } = {}
): React.ReactElement {
  let wrappedElement = element

  if (options.requireAuth || options.requireAdmin) {
    wrappedElement = (
      <ProtectedRoute requireAdmin={options.requireAdmin}>
        {wrappedElement}
      </ProtectedRoute>
    )
  }

  return <Suspense fallback={<LoadingFallback />}>{wrappedElement}</Suspense>
}

function buildRoutes(): RouteConfig[] {
  return [
    {
      path: '/',
      element: wrapRoute(<RootRoute />),
    },
    ...authRoutes.map((route) => ({
      path: route.path,
      element: wrapRoute(route.element),
    })),
    ...publicUserRoutes.map((route) => ({
      path: route.path,
      element: wrapRoute(route.element),
    })),
    ...userRoutes.map((route) => ({
      path: route.path,
      element: wrapRoute(route.element, { requireAuth: true }),
    })),
    ...adminRoutes.map((route) => ({
      path: route.path,
      element: wrapRoute(route.element, {
        requireAuth: true,
        requireAdmin: true,
      }),
    })),
  ]
}

export function AppRoutes() {
  const routes = buildRoutes()

  return (
    <Routes>
      {routes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
      <Route path='*' element={<NotFoundPage />} />
    </Routes>
  )
}

