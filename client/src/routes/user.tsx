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

export const publicUserRoutes = [
  {
    path: '/profile/remote',
    element: <ProfilePage />,
  },
  {
    path: '/post',
    element: <PostDetailPage />,
  },
]

export const userRoutes = [
  {
    path: '/profile/:username',
    element: <ProfilePage />,
  },
  {
    path: '/post/:username/:guid',
    element: <PostDetailPage />,
  },
]

