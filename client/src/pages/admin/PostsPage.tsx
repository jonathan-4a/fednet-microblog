// src/pages/admin/PostsPage.tsx
import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useAdminPostsQuery } from '../../hooks/queries/useAdminQueries'
import { useDeletePostMutation } from '../../hooks/mutations/useAdminMutations'
import { FilterBar } from '../../components/admin/FilterBar'
import { PostsTable } from '../../components/admin/PostsTable'
import { PaginationControls } from '../../components/admin/PaginationControls'
import { LoadingSpinner } from '../../components/LoadingSpinner'

export function PostsPage() {
  const [page, setPage] = useState(1)
  const [authorFilter, setAuthorFilter] = useState('')
  const [appliedAuthorFilter, setAppliedAuthorFilter] = useState('')

  const {
    data: postsData,
    isLoading: loading,
    error,
  } = useAdminPostsQuery({
    page,
    limit: 20,
    authorUsername: appliedAuthorFilter || undefined,
  })

  const deletePost = useDeletePostMutation()

  const posts = postsData?.posts || []
  const pagination = postsData?.pagination || null

  const handleSearch = () => {
    setPage(1)
    setAppliedAuthorFilter(authorFilter.trim())
  }

  const handleDelete = async (guid: string) => {
    if (!confirm('Delete this post?')) return
    try {
      await deletePost.mutateAsync(guid)
    } catch {
      // Error handled by hook
    }
  }

  return (
    <Box>
      <Typography
        sx={{
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'text.primary',
          mb: 2,
        }}
      >
        Posts
      </Typography>

      {error && (
        <Typography color='error' sx={{ mb: 2 }}>
          {error.message}
        </Typography>
      )}

      <FilterBar
        searchValue={authorFilter}
        onSearchChange={setAuthorFilter}
        onSearch={handleSearch}
      />

      {loading && !posts.length ? (
        <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
          <LoadingSpinner />
        </Box>
      ) : posts.length === 0 ? (
        <Box
          sx={{
            mt: 2,
            py: 4,
            textAlign: 'center',
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'rgba(0, 0, 0, 0.12)',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            No posts found
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5, fontSize: 12 }}>
            {authorFilter
              ? `No posts found for author "${authorFilter}"`
              : 'There are no posts in the system yet'}
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ mt: 3 }}>
            <PostsTable posts={posts} onDelete={handleDelete} />
          </Box>
          <PaginationControls
            pagination={pagination}
            page={page}
            onPageChange={setPage}
          />
        </>
      )}
    </Box>
  )
}

