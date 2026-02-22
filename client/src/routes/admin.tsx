import { lazy } from 'react'

const AdminPage = lazy(() =>
  import('../pages/admin/AdminPage').then((module) => ({
    default: module.AdminPage,
  }))
)

const adminPaths = [
  '/admin',
  '/admin/users',
  '/admin/posts',
  '/admin/settings',
  '/admin/invites',
]

export const adminRoutes = adminPaths.map((path) => ({
  path,
  element: <AdminPage />,
}))

