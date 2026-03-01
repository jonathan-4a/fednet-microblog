// src/services/posts/utils.ts
import { getLiked } from '../socials'
export { fetchResource, isRemoteUrl } from '../proxy'

/**
 * Resolves a possibly-relative URL against a base URL.
 * Remote servers (e.g. Mastodon) may return relative URLs for replies/likes;
 * without this, the client would request our own origin and get no data.
 */
export function resolveUrl(url: string, baseUrl: string): string {
  if (!url || url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  try {
    return new URL(url, baseUrl).href
  } catch {
    return url
  }
}

export function extractUsernameFromActorUrl(actorUrl: string): string | null {
  try {
    const url = new URL(actorUrl)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const uIndex = pathParts.indexOf('u')
    if (uIndex !== -1 && uIndex < pathParts.length - 1) {
      return pathParts[uIndex + 1]
    }
    // Mastodon and others use /users/:username
    const usersIndex = pathParts.indexOf('users')
    if (usersIndex !== -1 && usersIndex < pathParts.length - 1) {
      return pathParts[usersIndex + 1]
    }
  } catch {
    return null
  }
  return null
}

export function extractFullHandleFromActorUrl(actorUrl: string): string | null {
  try {
    const url = new URL(actorUrl)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const uIndex = pathParts.indexOf('u')
    if (uIndex !== -1 && uIndex < pathParts.length - 1) {
      return `${pathParts[uIndex + 1]}@${url.hostname}`
    }
    // Mastodon and others use /users/:username
    const usersIndex = pathParts.indexOf('users')
    if (usersIndex !== -1 && usersIndex < pathParts.length - 1) {
      return `${pathParts[usersIndex + 1]}@${url.hostname}`
    }
  } catch {
    return null
  }
  return null
}

export function extractUsernameFromNoteId(noteId: string): string | null {
  const uMatch = noteId.match(/\/u\/([^/]+)/)
  if (uMatch) return uMatch[1]
  const usersMatch = noteId.match(/\/users\/([^/]+)/)
  return usersMatch ? usersMatch[1] : null
}

export function extractGuidFromNoteId(noteId: string): string {
  if (noteId.includes('/statuses/'))
    return noteId.split('/statuses/').pop() || ''
  // Handle #note- format (server format: http://domain/posts/guid#note-guid)
  if (noteId.includes('#note-')) {
    const guid = noteId.split('#note-')[1]
    return guid || ''
  }
  // Handle other # formats
  if (noteId.includes('#')) return noteId.split('#').pop() || ''
  if (noteId) return noteId.split('/').pop() || ''
  return ''
}

export async function fetchLikedPostIds(likedUrl: string): Promise<Set<string>> {
  try {
    const likedCollection = await getLiked(likedUrl)
    if (!likedCollection) return new Set()
    return new Set(
      (likedCollection.orderedItems || []).map((item) => {
        if (typeof item === 'string') {
          return item
        }
        if (item && typeof item === 'object' && 'id' in item) {
          return (item as { id: string }).id
        }
        return ''
      })
    )
  } catch {
    return new Set()
  }
}

export async function processInBatches<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(processor))
    results.push(...batchResults)
  }
  return results
}


