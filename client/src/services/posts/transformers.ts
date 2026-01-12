import type { Note, Actor, OrderedCollectionPage } from '../../types/activitypub'
import type { Post } from '../../types/posts'
import {
  isRemoteUrl,
  extractUsernameFromActorUrl,
  extractFullHandleFromActorUrl,
  extractUsernameFromNoteId,
  extractGuidFromNoteId,
} from './utils'

export function transformNoteToPost(
  note: Note,
  username: string,
  likedPostIds: Set<string>
): Post | null {
  if (!note.id) {
    return null
  }

  const noteId = note.id
  const guid = extractGuidFromNoteId(noteId)
  const isRemote = isRemoteUrl(noteId)

  // For local posts, use the username parameter directly (matches database storage)
  // For remote posts, extract from attributedTo or noteId
  let authorUsername = username
  if (isRemote && note.attributedTo) {
    const extracted = extractUsernameFromActorUrl(note.attributedTo as string)
    if (extracted) {
      authorUsername = extracted
    } else {
      const fallback = extractUsernameFromNoteId(noteId)
      if (fallback) {
        authorUsername = fallback
      }
    }
  } else if (isRemote) {
    const fallback = extractUsernameFromNoteId(noteId)
    if (fallback) {
      authorUsername = fallback
    }
  }
  // For local posts, keep authorUsername as the provided username (no extraction needed)

  const likesObj = note.likes as { totalItems?: number; id?: string } | undefined
  const likesCount = likesObj?.totalItems ?? 0

  const sharesObj = note.shares as { totalItems?: number; id?: string } | undefined
  const sharesCount = sharesObj?.totalItems ?? 0

  const repliesObj = note.replies as {
    totalItems?: number
    id?: string
    first?: OrderedCollectionPage | string | { orderedItems?: unknown[]; items?: unknown[]; next?: string }
  } | undefined
  
  let repliesCount = repliesObj?.totalItems ?? 0
  if (repliesCount === 0 && repliesObj?.first) {
    const firstPage = repliesObj.first
    if (typeof firstPage === 'object' && firstPage !== null && !('id' in firstPage)) {
      const items = firstPage.orderedItems ?? firstPage.items ?? []
      repliesCount = items.length
      // Note: If first page is empty but has next link, we can't know exact count
      // without fetching, so we leave it as 0 for list views
      // Post details will fetch and count properly
    }
  }

  const isLiked = likedPostIds.has(noteId)

  return {
    guid,
    author_username: authorUsername,
    content: note.content,
    created_at: new Date(note.published).toISOString(),
    raw_message: note as object | null,
    likesCount,
    repliesCount,
    sharesCount,
    isLiked,
    noteId,
    isRemote,
    inReplyTo: note.inReplyTo ?? null,
  }
}

export function transformNoteToPostDetail(
  note: Note,
  noteIdUrl: string,
  likedPostIds: Set<string>,
  actor?: Actor
): Post | null {
  const noteId = note.id || noteIdUrl
  if (!noteId) {
    return null
  }
  const guid = extractGuidFromNoteId(noteId)
  const isRemote = isRemoteUrl(noteId)

  let authorUsername = ''
  let authorName: string | undefined

  if (actor) {
    if (actor.name) {
      authorName = actor.name
    }
    if (actor.id) {
      const fullHandle = extractFullHandleFromActorUrl(actor.id)
      if (fullHandle) {
        authorUsername = fullHandle
      } else if (actor.preferredUsername) {
        try {
          const actorUrl = new URL(actor.id)
          authorUsername = `${actor.preferredUsername}@${actorUrl.hostname}`
        } catch {
          if (actor.preferredUsername.includes('@')) {
            authorUsername = actor.preferredUsername
          } else {
            authorUsername = actor.preferredUsername
          }
        }
      }
    }
  }

  if (!authorUsername && note.attributedTo) {
    const fullHandle = extractFullHandleFromActorUrl(
      note.attributedTo as string
    )
    if (fullHandle) {
      authorUsername = fullHandle
    } else {
      const extracted = extractUsernameFromActorUrl(note.attributedTo as string)
      if (extracted) {
        try {
          const actorUrl = new URL(note.attributedTo as string)
          authorUsername = `${extracted}@${actorUrl.hostname}`
        } catch {
          authorUsername = extracted
        }
      }
    }
  }

  if (!authorUsername) {
    const fallback = extractUsernameFromNoteId(noteId)
    if (fallback) {
      try {
        const noteUrl = new URL(noteId)
        authorUsername = `${fallback}@${noteUrl.hostname}`
      } catch {
        authorUsername = fallback
      }
    }
  }

  if (!authorUsername) {
    return null
  }

  const likesObj = note.likes as { totalItems?: number; id?: string } | undefined
  const likesCount = likesObj?.totalItems ?? 0

  const sharesObj = note.shares as { totalItems?: number; id?: string } | undefined
  const sharesCount = sharesObj?.totalItems ?? 0

  const repliesObj = note.replies as {
    totalItems?: number
    id?: string
    first?: OrderedCollectionPage | string | { orderedItems?: unknown[]; items?: unknown[]; next?: string }
  } | undefined
  
  let repliesCount = repliesObj?.totalItems ?? 0
  if (repliesCount === 0 && repliesObj?.first) {
    const firstPage = repliesObj.first
    if (typeof firstPage === 'object' && firstPage !== null && !('id' in firstPage)) {
      const items = firstPage.orderedItems ?? firstPage.items ?? []
      repliesCount = items.length
      // Note: If first page is empty but has next link, we can't know exact count
      // without fetching, so we leave it as 0 for list views
      // Post details will fetch and count properly
    }
  }

  const isLiked = likedPostIds.has(noteId)

  return {
    guid,
    author_username: authorUsername,
    author_name: authorName,
    content: note.content,
    created_at: new Date(note.published).toISOString(),
    raw_message: note as object | null,
    likesCount,
    repliesCount,
    sharesCount,
    isLiked,
    noteId,
    isRemote,
    inReplyTo: note.inReplyTo ?? null,
  }
}


