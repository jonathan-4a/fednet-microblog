// src/pages/HomePage.tsx
import { Box, Typography } from '@mui/material'
import { AppLayout } from '../components/layout/AppLayout'
import { useAuthStore } from '../stores/authStore'
import { PostList } from '../components/post/PostList'
import { useHomeFeedQuery } from '../hooks/queries/useHomeFeedQuery'
import { usePostInteractions } from '../hooks/usePostInteractions'

export function HomePage() {
  const { user } = useAuthStore()
  const username = user?.username

  const { handleLike } = usePostInteractions(username)

  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useHomeFeedQuery(username, {
    maxDepth: 4,
    maxUsers: 50,
    postsPerUserLimit: 20,
    maxPosts: 200,
    includeSelf: false,
    edgeDirection: 'both',
  })

  const feedItems = data?.pages.flatMap((page) => page.items) ?? []

  return (
    <AppLayout>
      <Box
        sx={{
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          p: 2,
          position: 'sticky',
          top: 0,
          backgroundColor: 'background.paper',
          backdropFilter: 'blur(12px)',
          zIndex: 10,
        }}
      >
        <Typography sx={{ fontSize: 20, fontWeight: 700 }}>Home</Typography>
      </Box>

      <Box sx={{ p: 0 }}>
        <PostList
          posts={feedItems}
          loading={isLoading || !username}
          error={
            !username
              ? 'You must be logged in to see your home feed.'
              : error
              ? error.message
              : null
          }
          onLike={handleLike}
          hasNextPage={hasNextPage}
          fetchNextPage={hasNextPage ? fetchNextPage : undefined}
          isFetchingNextPage={isFetchingNextPage}
        />
      </Box>
    </AppLayout>
  )
}

