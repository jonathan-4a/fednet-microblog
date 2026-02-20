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

  const {
    data: postsData,
    isLoading: loading,
    error,
    refetch,
  } = useAdminPostsQuery({
    page,
    limit: 20,
    authorUsername: authorFilter || undefined,
  })

  const deletePost = useDeletePostMutation()

  const posts = postsData?.posts || []
  const pagination = postsData?.pagination || null

  const handleSearch = () => {
    setPage(1)
    refetch()
  }

  const handleDelete = async (guid: string) => {
    if (!confirm('Delete this post?')) return
    try {
      await deletePost.mutateAsync(guid)
    } catch {
      // Error handled by hook
    }
  }

  if (loading && !posts.length) {
    return <LoadingSpinner />
  }

  return (
    <Box>
      <Typography variant='h5' gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
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

      {posts.length === 0 && !loading ? (
        <Box
          sx={{
            mt: 4,
            py: 6,
            textAlign: 'center',
            border: '1px dashed',
            borderColor: 'rgba(0, 0, 0, 0.12)',
            borderRadius: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <Typography variant='body1' color='text.secondary'>
            No posts found
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
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

