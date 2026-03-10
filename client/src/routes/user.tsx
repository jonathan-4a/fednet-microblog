// src/routes/user.tsx
import { lazy } from 'react'

const ProfilePage = lazy(() =>
  import('../pages/ProfilePage').then((module) => ({
    default: module.ProfilePage,
  }))
)

const PostDetailPage = lazy(() =>
  import('../pages/PostDetailPage').then((module) => ({
    default: module.PostDetailPage,
  }))
)

const NotificationsPage = lazy(() =>
  import('../pages/NotificationsPage').then((module) => ({
    default: module.NotificationsPage,
  }))
)

export const publicUserRoutes = [
  {
    path: '/profile/remote',
    element: <ProfilePage />,
  },
]

export const userRoutes = [
  {
    path: '/post',
    element: <PostDetailPage />,
  },
  {
    path: '/profile/:username',
    element: <ProfilePage />,
  },
  {
    path: '/notifications',
    element: <NotificationsPage />,
  },
  {
    path: '/post/:username/:guid',
    element: <PostDetailPage />,
  },
]

