import { useCollectionQuery } from './useCollectionQuery'

export function useFollowingQuery(
  username: string | undefined,
  followingUrl?: string
) {
  return useCollectionQuery('following', username, followingUrl)
}

