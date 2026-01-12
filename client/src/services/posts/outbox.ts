import { API_BASE } from '../../config'
import type {
  OrderedCollectionPage,
  Note,
  OutboxResponse,
  OrderedCollection,
} from '../../types/activitypub'
import type { Post } from '../../types/posts'
import { getOutbox } from '../federation'
import { fetchResource, fetchLikedPostIds, processInBatches } from './utils'
import { parseOutboxReplies, parseOutboxPageItems } from './parsers'

export async function getUserPosts(
  username: string,
  params?: {
    page?: number
    limit?: number
    currentUsername?: string
    outboxUrl?: string
  }
): Promise<{
  posts: Post[]
  replies: Post[]
  totalItems: number
  next?: string | null
  private?: boolean
}> {
  const likedPostIds = params?.currentUsername
    ? await fetchLikedPostIds(`${API_BASE}/u/${params.currentUsername}/liked`)
    : new Set<string>()

  const outboxUrl = params?.outboxUrl || `${API_BASE}/u/${username}/outbox`
  let collection: OrderedCollection
  try {
    collection = await getOutbox(
      outboxUrl,
      params?.page
        ? {
            page: params.page,
            limit: params.limit,
          }
        : {
            limit: params?.limit,
          }
    )
  } catch (e) {
    const err = e as { status?: number }
    if (err && typeof err === 'object' && err.status === 403) {
      return { posts: [], replies: [], totalItems: 0, private: true }
    }
    throw e
  }

  // Extract orderedItems from the first page (mixed Create and Announce)
  let orderedItems: unknown[] = []
  let next: string | null = null

  if (collection.first) {
    if (typeof collection.first === 'string') {
      const firstPage = await fetchResource<OrderedCollectionPage>(
        collection.first
      )
      orderedItems = (firstPage.orderedItems || []) as unknown[]
      next = firstPage.next || null
    } else if (
      typeof collection.first === 'object' &&
      collection.first !== null
    ) {
      const firstPage = collection.first as OrderedCollectionPage
      if ('orderedItems' in firstPage) {
        orderedItems = (firstPage.orderedItems || []) as unknown[]
      }
      next = firstPage.next || null
    }
  }

  if (
    orderedItems.length === 0 &&
    'orderedItems' in collection &&
    Array.isArray(collection.orderedItems)
  ) {
    orderedItems = (collection.orderedItems || []) as unknown[]
  }

  const effectiveUsername = username || 'unknown'

  // Fetch Announce object URLs in batch so we can show reposts
  const announceUrls = orderedItems
    .filter((a): a is { type: 'Announce'; object: string } => (a as { type?: string }).type === 'Announce' && typeof (a as { object?: unknown }).object === 'string')
    .map((a) => (a as { object: string }).object)
  const announceNotes = new Map<string, Note>()
  await processInBatches(announceUrls, async (url) => {
    try {
      const note = await fetchResource<Note>(url)
      if (note?.id) announceNotes.set(url, note)
    } catch {
      // Skip failed fetches
    }
  }, 5)

  let posts = parseOutboxPageItems(
    orderedItems,
    effectiveUsername,
    likedPostIds,
    announceNotes
  )

  // Derive replies from the same page (no extra fetch) so Posts/Reposts/Replies tabs share one cache
  const pageForReplies = { orderedItems } as unknown as OutboxResponse
  const replies = parseOutboxReplies(pageForReplies, effectiveUsername, likedPostIds)

  // Fetch replies counts for remote posts (Mastodon doesn't include totalItems in Note)
  // Use raw_message from post if available to avoid refetching
  posts = await processInBatches(
    posts,
    async (post: Post) => {
      if (!post.isRemote || !post.noteId) return post
      
      // Skip if replies count is already set and > 0 (from embedded data)
      if (post.repliesCount !== undefined && post.repliesCount > 0) return post
      
      try {
        // Get replies.id from raw_message if available, otherwise fetch Note
        let repliesObj: { id?: string; totalItems?: number } | undefined
        if (post.raw_message && typeof post.raw_message === 'object') {
          const note = post.raw_message as Note
          repliesObj = note.replies as { id?: string; totalItems?: number } | undefined
        } else {
          const note = await fetchResource<Note>(post.noteId)
          repliesObj = note.replies as { id?: string; totalItems?: number } | undefined
        }
        
        if (repliesObj?.id) {
          const repliesCollection = await fetchResource<OrderedCollection>(repliesObj.id)
          
          if (repliesCollection.totalItems !== undefined) {
            return { ...post, repliesCount: repliesCollection.totalItems }
          }
          
          // Count items from pages
          let totalCount = 0
          let currentPage: OrderedCollectionPage | null = null
          
          if (typeof repliesCollection.first === 'string') {
            currentPage = await fetchResource<OrderedCollectionPage>(repliesCollection.first)
          } else if (repliesCollection.first) {
            currentPage = repliesCollection.first as OrderedCollectionPage
          }
          
          if (currentPage) {
            const items = (currentPage.orderedItems || currentPage.items || []) as unknown[]
            totalCount += items.length
            
            if (items.length === 0 && currentPage.next && typeof currentPage.next === 'string') {
              try {
                const nextPage = await fetchResource<OrderedCollectionPage>(currentPage.next)
                const nextItems = (nextPage.orderedItems || nextPage.items || []) as unknown[]
                totalCount += nextItems.length
              } catch {
                // Continue with count from first page
              }
            } else if (items.length > 0 && currentPage.next && typeof currentPage.next === 'string') {
              try {
                const nextPage = await fetchResource<OrderedCollectionPage>(currentPage.next)
                const nextItems = (nextPage.orderedItems || nextPage.items || []) as unknown[]
                totalCount += nextItems.length
              } catch {
                // Continue with count from first page
              }
            }
          }
          
          return { ...post, repliesCount: totalCount }
        }
      } catch {
        // Continue with existing post if fetch fails
      }
      
      return post
    },
    5
  )

  // For remote servers, totalItems might be in the first page, not the collection
  // But we should prioritize collection.totalItems as it's the authoritative source
  let totalItems = collection.totalItems
  if (
    (totalItems === undefined || totalItems === null) &&
    typeof collection.first === 'object' &&
    collection.first !== null
  ) {
    const firstPage = collection.first as OrderedCollectionPage & {
      totalItems?: number
    }
    if (firstPage.totalItems !== undefined && firstPage.totalItems !== null) {
      totalItems = firstPage.totalItems
    }
  }
  // Don't use orderedItems.length as fallback - it's misleading when we only have the first page
  // If totalItems is missing, we'll return 0 and let the UI handle it
  // The actual total should come from the collection, not the first page count

  return {
    posts,
    replies,
    totalItems: totalItems ?? 0,
    next,
  }
}

// Fetch a specific page of posts from an outbox (for pagination)
export async function getPostCollectionPage(
  pageUrl: string,
  username: string,
  params?: {
    currentUsername?: string
  }
): Promise<{
  posts: Post[]
  replies: Post[]
  totalItems: number
  next?: string | null
}> {
  const likedPostIds = params?.currentUsername
    ? await fetchLikedPostIds(`${API_BASE}/u/${params.currentUsername}/liked`)
    : new Set<string>()

  const page = await fetchResource<OrderedCollectionPage>(pageUrl)
  const orderedItems = (page.orderedItems || []) as unknown[]

  const announceUrls = orderedItems
    .filter((a): a is { type: 'Announce'; object: string } => (a as { type?: string }).type === 'Announce' && typeof (a as { object?: unknown }).object === 'string')
    .map((a) => (a as { object: string }).object)
  const announceNotes = new Map<string, Note>()
  await processInBatches(announceUrls, async (url) => {
    try {
      const note = await fetchResource<Note>(url)
      if (note?.id) announceNotes.set(url, note)
    } catch {
      // Skip failed fetches
    }
  }, 5)

  const posts = parseOutboxPageItems(
    orderedItems,
    username,
    likedPostIds,
    announceNotes
  )

  const replies = parseOutboxReplies(page as unknown as OutboxResponse, username, likedPostIds)

  // For paginated pages, totalItems should come from the original collection, not the page
  const pageTotalItems = (
    page as OrderedCollectionPage & { totalItems?: number }
  ).totalItems

  return {
    posts,
    replies,
    totalItems: pageTotalItems ?? 0,
    next: page.next || null,
  }
}

export async function getUserReplies(
  username: string,
  params?: {
    page?: number
    limit?: number
    currentUsername?: string
    outboxUrl?: string
  }
): Promise<{
  posts: Post[]
  totalItems: number
  next?: string | null
}> {
  const likedPostIds = params?.currentUsername
    ? await fetchLikedPostIds(`${API_BASE}/u/${params.currentUsername}/liked`)
    : new Set<string>()

  const outboxUrl = params?.outboxUrl || `${API_BASE}/u/${username}/outbox`
  let response = (await getOutbox(outboxUrl, {
    page: params?.page,
    limit: params?.limit,
  })) as OutboxResponse | OrderedCollection

  // Mastodon with ?limit=50 returns OrderedCollection with first as URL string (no items at root).
  // We must fetch the first page to get orderedItems; otherwise we get 0 replies.
  let collectionTotalItems: number | undefined
  let next: string | null = null
  const coll = response as OrderedCollection & { first?: string | OrderedCollectionPage }
  if (
    coll.first &&
    typeof coll.first === 'string' &&
    !(response as { orderedItems?: unknown[] }).orderedItems
  ) {
    collectionTotalItems = coll.totalItems
    const firstPage = await fetchResource<OrderedCollectionPage>(coll.first)
    next = firstPage.next || null
    response = firstPage as unknown as OutboxResponse
  } else if (
    (response as { next?: string }).next &&
    typeof (response as { next?: string }).next === 'string'
  ) {
    next = (response as { next?: string }).next || null
  }

  const posts = parseOutboxReplies(response as OutboxResponse, username, likedPostIds)

  // totalItems: collection has it; page may not (Mastodon returns page directly)
  const totalItems =
    collectionTotalItems ??
    (response as OutboxResponse & { totalItems?: number }).totalItems ??
    (response as { orderedItems?: unknown[]; items?: unknown[] }).orderedItems?.length ??
    (response as { items?: unknown[] }).items?.length ??
    posts.length

  return {
    posts,
    totalItems: typeof totalItems === 'number' ? totalItems : 0,
    next,
  }
}

/** Fetch one page of outbox by URL and return only replies (for pagination). */
export async function getRepliesCollectionPage(
  pageUrl: string,
  username: string,
  params?: {
    currentUsername?: string
  }
): Promise<{
  posts: Post[]
  totalItems: number
  next?: string | null
}> {
  const likedPostIds = params?.currentUsername
    ? await fetchLikedPostIds(`${API_BASE}/u/${params.currentUsername}/liked`)
    : new Set<string>()

  const page = await fetchResource<OrderedCollectionPage>(pageUrl)
  const posts = parseOutboxReplies(page as unknown as OutboxResponse, username, likedPostIds)
  const totalItems =
    (page as OrderedCollectionPage & { totalItems?: number }).totalItems ?? 0

  return {
    posts,
    totalItems,
    next: page.next || null,
  }
}


