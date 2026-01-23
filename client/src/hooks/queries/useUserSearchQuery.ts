import { useQuery } from '@tanstack/react-query'
import { searchUsers } from '../../services/users'
import { getWebFinger } from '../../services/webfinger'
import { API_BASE } from '../../config'
import { logger } from '../../utils/logger'
import type { UserProfileOutput } from '../../types/user'

export interface SearchResult {
  local: UserProfileOutput[]
  remoteUrl?: string
  remoteUsername?: string
  remoteAddress?: string
}

/**
 * Get local domain from API_BASE
 */
function getLocalDomain(): string {
  try {
    const url = new URL(API_BASE)
    return url.hostname
  } catch {
    return 'localhost'
  }
}

/**
 * Build acct: address from query with @
 */
function buildAcctAddress(query: string): string {
  const trimmed = query.trim()
  // If it already has @, use it as is
  if (trimmed.includes('@')) {
    return `acct:${trimmed}`
  }
  // No @, add local domain
  const localDomain = getLocalDomain()
  return `acct:${trimmed}@${localDomain}`
}

export function useUserSearchQuery(query: string, currentUsername?: string) {
  const trimmed = query.trim()

  return useQuery<SearchResult, Error>({
    queryKey: ['userSearch', trimmed, currentUsername],
    queryFn: async () => {
      if (!trimmed) {
        return { local: [] }
      }

      // If query has @, use WebFinger
      if (trimmed.includes('@')) {
        const acctAddress = buildAcctAddress(trimmed)
        
        // Extract username for comparison
        const usernameMatch = acctAddress.match(/^acct:([^@]+)@/)
        const username = usernameMatch ? usernameMatch[1] : trimmed

        // Don't show if user is searching for themselves
        if (currentUsername && username === currentUsername) {
          return { local: [] }
        }

        // Use WebFinger to resolve the address
        const actorUrl = await getWebFinger(acctAddress)

        if (!actorUrl) {
          return { local: [] }
        }

        // Extract domain from acct address for display
        const domainMatch = acctAddress.match(/@([^:]+)(?::(\d+))?$/)
        const domain = domainMatch ? domainMatch[1] : getLocalDomain()
        const port = domainMatch ? domainMatch[2] : undefined

        return {
          local: [],
          remoteUrl: actorUrl, // Return the resolved actor URL, not the acct: address
          remoteUsername: username,
          remoteAddress: `${username}@${domain}${port ? `:${port}` : ''}`,
        }
      }

      // No @, use local search API
      try {
        const local = await searchUsers({ q: trimmed, limit: 5 })
        return { local: local || [] }
      } catch (error) {
        logger.error('Local search failed:', error)
        return { local: [] }
      }
    },
    enabled: trimmed.length > 0,
    staleTime: 10000,
  })
}

