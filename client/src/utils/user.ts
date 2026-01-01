import { API_BASE } from '../config'

export function isRemoteUser(userId: string): boolean {
  try {
    const url = new URL(userId)
    const localDomain = new URL(API_BASE).hostname
    return url.hostname !== localDomain && url.hostname !== 'localhost'
  } catch {
    return false
  }
}

export function formatUserAddress(
  userId: string,
  preferredUsername: string
): string {
  if (!isRemoteUser(userId)) {
    return `@${preferredUsername}`
  }

  try {
    const url = new URL(userId)
    const domain = url.hostname + (url.port ? `:${url.port}` : '')
    return `${preferredUsername}@${domain}`
  } catch {
    return `@${preferredUsername}`
  }
}

/**
 * Get profile URL from post author information
 * Works like UserListItem - uses actor URL if available, otherwise constructs from username
 * @param authorUsername - The author username (may be handle like "user@domain.com" or just "user")
 * @param noteId - Optional noteId to extract domain from if authorUsername doesn't contain domain
 * @param rawMessage - Optional raw_message object that may contain attributedTo (actor URL)
 * @returns Profile URL path
 */
export function getProfileUrlFromPost(
  authorUsername: string,
  noteId?: string,
  rawMessage?: object | null
): string {
  if (!authorUsername) {
    return '/'
  }

  // First, try to extract actor URL from raw_message.attributedTo (like UserListItem uses user.id)
  if (rawMessage && typeof rawMessage === 'object') {
    try {
      const note = rawMessage as { attributedTo?: string | { id?: string } }
      let actorUrl: string | undefined
      
      if (typeof note.attributedTo === 'string') {
        actorUrl = note.attributedTo
      } else if (note.attributedTo && typeof note.attributedTo === 'object' && 'id' in note.attributedTo) {
        actorUrl = note.attributedTo.id
      }
      
      if (actorUrl) {
        // Use the actor URL directly, just like UserListItem does
        const isRemote = isRemoteUser(actorUrl)
        
        if (isRemote) {
          const profileUrl = `/profile/remote?url=${encodeURIComponent(actorUrl)}`
          return profileUrl
        } else {
          // Extract username from local actor URL
          try {
            const url = new URL(actorUrl)
            const pathParts = url.pathname.split('/').filter(Boolean)
            const uIndex = pathParts.indexOf('u')
            if (uIndex !== -1 && uIndex < pathParts.length - 1) {
              const localProfileUrl = `/profile/${pathParts[uIndex + 1]}`
              return localProfileUrl
            }
          } catch {
            // Fall through to username-based logic
          }
        }
      }
    } catch {
      // Fall through to username-based logic
    }
  }

  // Fallback: Check if username contains @ (remote user)
  if (authorUsername.includes('@')) {
    const [username, domain] = authorUsername.split('@')
    if (!username || !domain) {
      // Invalid format, treat as local
      return `/profile/${authorUsername}`
    }
    
    // Construct actor URL from handle
    try {
      // Try to determine protocol from noteId if available
      let protocol = 'https'
      if (noteId) {
        try {
          const noteUrl = new URL(noteId)
          protocol = noteUrl.protocol.slice(0, -1) // Remove trailing ':'
        } catch {
          // Use default https
        }
      }
      const actorUrl = `${protocol}://${domain}/u/${username}`
      const profileUrl = `/profile/remote?url=${encodeURIComponent(actorUrl)}`
      return profileUrl
    } catch {
      // Fallback: try to extract from noteId
      if (noteId) {
        try {
          const noteUrl = new URL(noteId)
          const actorUrl = `${noteUrl.protocol}//${domain}/u/${username}`
          const profileUrl = `/profile/remote?url=${encodeURIComponent(actorUrl)}`
          return profileUrl
        } catch {
          // Last resort: use username only
          return `/profile/${username}`
        }
      }
      return `/profile/${username}`
    }
  }

  // Check if noteId indicates remote user
  if (noteId) {
    try {
      if (isRemoteUser(noteId)) {
        // Extract domain from noteId and construct actor URL
        const noteUrl = new URL(noteId)
        const protocol = noteUrl.protocol.slice(0, -1)
        const actorUrl = `${protocol}://${noteUrl.hostname}${noteUrl.port ? `:${noteUrl.port}` : ''}/u/${authorUsername}`
        return `/profile/remote?url=${encodeURIComponent(actorUrl)}`
      }
    } catch {
      // Invalid URL, treat as local
    }
  }

  // Local user
  return `/profile/${authorUsername}`
}

/**
 * Format number with k/m notation (e.g., 1200 -> "1.2k", 1500000 -> "1.5m")
 */
export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '0'
  if (num < 1000) return num.toString()
  if (num < 1000000) {
    const k = num / 1000
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`
  }
  const m = num / 1000000
  return m % 1 === 0 ? `${m}m` : `${m.toFixed(1)}m`
}

