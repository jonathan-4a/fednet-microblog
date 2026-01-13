import { API_BASE } from '../config'

/**
 * Checks if a URL is remote (not from our API server)
 */
export function isRemoteUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const apiBaseUrl = new URL(API_BASE)
    
    // Compare hostnames
    if (urlObj.hostname !== apiBaseUrl.hostname) {
      return true
    }
    
    // Compare ports, handling default ports (80 for HTTP, 443 for HTTPS)
    const urlPort = urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80')
    const apiPort = apiBaseUrl.port || (apiBaseUrl.protocol === 'https:' ? '443' : '80')
    
    return urlPort !== apiPort
  } catch {
    return true
  }
}

/**
 * Fetches a resource, proxying through the server if it's remote
 */
export async function fetchResource<T>(
  url: string,
  options?: {
    acceptHeader?: string
    signal?: AbortSignal
  }
): Promise<T> {
  const { useAuthStore } = await import('../stores/authStore')
  const token = useAuthStore.getState().token

  const isRemote = isRemoteUrl(url)

  if (isRemote) {
    // Use proxy endpoint for remote resources (requires auth)
    if (!token) {
      throw new Error('Authentication required to fetch remote resources')
    }

    const proxyUrl = `${API_BASE}/api/proxy?url=${encodeURIComponent(
      url
    )}`
    const response = await fetch(proxyUrl, {
      headers: {
        Accept: options?.acceptHeader || 'application/activity+json',
        Authorization: `Bearer ${token}`,
      },
      signal: options?.signal,
    })

    if (!response.ok) {
      const isExpected403 = response.status === 403 && (url.includes('/followers') || url.includes('/following'))
      
      if (isExpected403) {
        return {
          type: 'OrderedCollectionPage',
          id: url,
          orderedItems: [],
          _collectionPrivate: true,
        } as T
      }
      
      const error = new Error(
        `Failed to fetch remote resource: ${response.status} ${response.statusText}`
      ) as Error & { status?: number }
      error.status = response.status
      throw error
    }

    // Check Content-Type before parsing JSON
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json') && !contentType.includes('application/activity+json')) {
      const text = await response.text()
      throw new Error(
        `Invalid content type: ${contentType}. Response: ${text.substring(0, 200)}`
      )
    }

    const data = await response.json()
    return data
  } else {
    // Direct fetch for local resources (may be public)
    const headers: Record<string, string> = {
      Accept: options?.acceptHeader || 'application/activity+json',
    }

    // Add auth if available (some local endpoints may require it)
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(url, {
      headers,
      signal: options?.signal,
    })

    if (!response.ok) {
      const isExpected403 = response.status === 403 && (url.includes('/followers') || url.includes('/following'))
      if (isExpected403) {
        return {
          type: 'OrderedCollection',
          id: url,
          totalItems: 0,
          orderedItems: [],
          _collectionPrivate: true,
        } as T
      }
      throw new Error(
        `Failed to fetch resource: ${response.status} ${response.statusText}`
      )
    }

    return response.json()
  }
}

/**
 * Fetches a WebFinger resource, proxying through the server
 */
export async function fetchWebFinger(
  resource: string
): Promise<{
  subject: string
  links: Array<{ rel: string; type: string; href: string }>
} | null> {
  const { useAuthStore } = await import('../stores/authStore')
  const token = useAuthStore.getState().token

  if (!token) {
    throw new Error('Authentication required to fetch WebFinger resources')
  }

  // Build full webfinger URL so we can use the same /api/proxy?url= endpoint
  const match = resource.match(/^(?:acct:)?([^@]+)@([^:]+)(?::(\d+))?$/)
  if (!match) return null
  const [, username, domain, port] = match
  const acctResource = port ? `acct:${username}@${domain}:${port}` : `acct:${username}@${domain}`
  const webfingerUrl = `http://${domain}${port ? `:${port}` : ''}/.well-known/webfinger?resource=${encodeURIComponent(acctResource)}`
  const proxyUrl = `${API_BASE}/api/proxy?url=${encodeURIComponent(webfingerUrl)}`

  try {
    const response = await fetch(proxyUrl, {
      headers: {
        Accept: 'application/jrd+json, application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(
        `Failed to fetch WebFinger: ${response.status} ${response.statusText}`
      )
    }

    return response.json()
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null
    }
    throw error
  }
}

