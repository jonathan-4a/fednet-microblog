// src/services/posts/parsers.ts
import type { OutboxResponse, CreateActivity, Note } from '../../types/activitypub'
import type { Post } from '../../types/posts'
import { transformNoteToPost } from './transformers'
import { extractFullHandleFromActorUrl, extractUsernameFromActorUrl } from './utils'
import type { OrderedCollectionPage } from '../../types/activitypub'

type OutboxActivity = (CreateActivity & { object: Note }) | { type: 'Announce'; actor: string; object: string; published: string }

function getOutboxOrderedItems(response: OutboxResponse | OrderedCollectionPage): OutboxActivity[] {
  const page = response as OrderedCollectionPage
  if (Array.isArray(page.orderedItems)) return page.orderedItems as OutboxActivity[]
  if (Array.isArray(page.items)) return page.items as OutboxActivity[]
  const coll = response as OutboxResponse
  const first = coll.first
  if (first && typeof first === 'object' && first !== null) {
    const items = (first as { orderedItems?: unknown[]; items?: unknown[] }).orderedItems ?? (first as { items?: unknown[] }).items
    return Array.isArray(items) ? (items as OutboxActivity[]) : []
  }
  return []
}

/** Parse only Create activities (original posts, excluding replies). Used when we need just creates. */
export function parseOutboxResponse(
  response: OutboxResponse,
  username: string,
  likedPostIds: Set<string>
): Post[] {
  const items = getOutboxOrderedItems(response)
  const posts: Post[] = []
  for (const activity of items) {
    if (activity.type !== 'Create') continue
    const note = activity.object
    if (typeof note !== 'object' || !note || note.inReplyTo) continue
    const post = transformNoteToPost(note, username, likedPostIds)
    if (post) posts.push(post)
  }
  return posts
}

/** Parse Create + Announce from orderedItems; for Announce, caller must fetch object and pass as second arg. */
export function parseOutboxPageItems(
  orderedItems: unknown[],
  username: string,
  likedPostIds: Set<string>,
  announceNotes: Map<string, Note>
): Post[] {
  const posts: Post[] = []
  for (const raw of orderedItems) {
    const activity = raw as OutboxActivity
    if (activity.type === 'Create') {
      const note = activity.object
      if (typeof note !== 'object' || !note || note.inReplyTo) continue
      const post = transformNoteToPost(note, username, likedPostIds)
      if (post) posts.push(post)
    } else if (activity.type === 'Announce') {
      const objectUrl = typeof activity.object === 'string' ? activity.object : (activity.object as Note)?.id
      if (!objectUrl) continue
      const note = announceNotes.get(objectUrl)
      if (!note) continue
      const post = transformNoteToPost(note, username, likedPostIds)
      if (post) {
        // Repost: author must always be the original poster (from the note), not the reposter (username)
        const originalAuthor =
          note.attributedTo != null
            ? extractFullHandleFromActorUrl(note.attributedTo as string) ??
              extractUsernameFromActorUrl(note.attributedTo as string)
            : null
        if (originalAuthor) {
          post.author_username = originalAuthor
        }
        post.isRepost = true
        post.repostedBy = activity.actor
        post.created_at = new Date(activity.published).toISOString()
        posts.push(post)
      }
    }
  }
  return posts
}

export function parseOutboxReplies(
  response: OutboxResponse,
  username: string,
  likedPostIds: Set<string>
): Post[] {
  const items = getOutboxOrderedItems(response)
  const posts: Post[] = []
  for (const activity of items) {
    const note = activity.type === 'Create' ? activity.object : null
    if (typeof note !== 'object' || !note || !note.inReplyTo) continue
    const post = transformNoteToPost(note, username, likedPostIds)
    if (post) posts.push(post)
  }
  return posts
}


