import { useCollectionQuery } from './useCollectionQuery'

export function useFollowersQuery(
  username: string | undefined,
  followersUrl?: string
) {
  return useCollectionQuery('followers', username, followersUrl)
}

