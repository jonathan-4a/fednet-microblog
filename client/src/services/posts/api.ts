// src/services/posts/api.ts
import { apiRequest } from '../apiClient'
import { API_BASE } from '../../config'
import { useAuthStore } from '../../stores/authStore'
import {
  ACTIVITY_STREAMS_CONTEXT,
  createNote,
  createCreateActivity,
  createAnnounceActivity,
  type Note,
  type OrderedCollection,
  type OrderedCollectionPage,
} from '../../types/activitypub'
import type {
  Post,
  CreatePostRequest,
  CreatePostResponse,
  UpdatePostRequest,
  UpdatePostResponse,
  DeletePostResponse,
} from '../../types/posts'
import {
  fetchResource,
  fetchLikedPostIds,
  processInBatches,
  resolveUrl,
} from './utils'
import { getLiked } from '../socials'
import { getActor } from '../federation'
import { transformNoteToPostDetail } from './transformers'
import type { Actor } from '../../types/activitypub'

// GET /u/{username}/statuses/{id}
export async function getPost(noteIdUrl: string): Promise<Note> {
  return fetchResource<Note>(noteIdUrl)
}

// GET /u/{username}/statuses/{id}/replies
export async function getPostReplies(
  noteIdUrl: string,
  params?: { page?: number; limit?: number }
): Promise<OrderedCollection> {
  const queryParams = new URLSearchParams()
  if (params?.page !== undefined) {
    if (params.page === 1) {
      queryParams.append('page', 'true')
    } else {
    queryParams.append('page', params.page.toString())
    }
  }
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString())
  }
  const query = queryParams.toString()
  const repliesUrl = query
    ? `${noteIdUrl}/replies?${query}`
    : `${noteIdUrl}/replies`
  
  const result = await fetchResource<OrderedCollection>(repliesUrl)
  
  return result
}

// GET /u/{username}/statuses/{id}/likes
export async function getPostLikes(
  noteIdUrl: string,
  params?: { page?: number; limit?: number }
): Promise<OrderedCollection> {
  const queryParams = new URLSearchParams()
  if (params?.page !== undefined) {
    queryParams.append('page', params.page.toString())
  }
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString())
  }
  const query = queryParams.toString()
  const likesUrl = query ? `${noteIdUrl}/likes?${query}` : `${noteIdUrl}/likes`
  return fetchResource<OrderedCollection>(likesUrl)
}

// GET /u/{username}/statuses/{id}/shares
export async function getPostShares(
  noteIdUrl: string,
  params?: { page?: number; limit?: number }
): Promise<OrderedCollection> {
  const queryParams = new URLSearchParams()
  if (params?.page !== undefined) {
    queryParams.append('page', params.page.toString())
  }
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString())
  }
  const query = queryParams.toString()
  const sharesUrl = query
    ? `${noteIdUrl}/shares?${query}`
    : `${noteIdUrl}/shares`
  return fetchResource<OrderedCollection>(sharesUrl)
}

// POST /u/{username}/outbox
export async function createPost(
  username: string,
  data: CreatePostRequest
): Promise<CreatePostResponse> {
  const publishedIso = new Date().toISOString()
  const actorUrl = `${API_BASE}/u/${username}`
  const noteId = ''

  const note = createNote({
    id: noteId,
    actorUrl,
    content: data.content,
    published: publishedIso,
    inReplyTo: data.inReplyTo || undefined,
  })

  const activity = createCreateActivity({
    actorUrl,
    note,
    published: publishedIso,
  })

  const headers = {
    'Content-Type': 'application/activity+json',
    Accept: 'application/activity+json',
  }

  return (await apiRequest(`/u/${username}/outbox`, {
    method: 'POST',
    headers,
    body: JSON.stringify(activity),
  })) as CreatePostResponse
}

// POST /u/{username}/outbox (Announce activity for repost)
export async function repostPost(
  username: string,
  noteId: string
): Promise<{ status: string }> {
  const token = useAuthStore.getState().token
  if (!token) {
    throw new Error('No authentication token found')
  }
  const actorUrl = `${API_BASE}/u/${username}`
  const activity = createAnnounceActivity({
    actorUrl,
    objectId: noteId,
  })
  const published = new Date().toISOString()
  const body = {
    ...activity,
    published,
    id: `${actorUrl}/announces/${encodeURIComponent(noteId)}#${Date.now()}`,
  }
  const headers = {
    'Content-Type': 'application/activity+json',
    Accept: 'application/activity+json',
    Authorization: `Bearer ${token}`,
  }
  return (await apiRequest(`/u/${username}/outbox`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })) as { status: string }
}

// PATCH /:id
export async function updatePost(
  guid: string,
  data: UpdatePostRequest
): Promise<UpdatePostResponse> {
  const token = useAuthStore.getState().token
  if (!token) {
    throw new Error('No authentication token found')
  }

  return (await apiRequest(`/${guid}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })) as UpdatePostResponse
}

// DELETE /:id
export async function deletePost(guid: string): Promise<DeletePostResponse> {
  const token = useAuthStore.getState().token
  if (!token) {
    throw new Error('No authentication token found')
  }

  return (await apiRequest(`/${guid}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })) as DeletePostResponse
}

export async function getPostDetails(
  noteIdUrl: string,
  params?: {
    currentUsername?: string
  }
): Promise<Post | null> {
  try {
    const note = await getPost(noteIdUrl)

    let actor: Actor | undefined
    if (note.attributedTo) {
      try {
        actor = await getActor(note.attributedTo as string)
      } catch {
        // Continue without actor data
      }
    }

    const likedPostIds = params?.currentUsername
      ? await fetchLikedPostIds(`${API_BASE}/u/${params.currentUsername}/liked`)
      : new Set<string>()

    const post = transformNoteToPostDetail(note, noteIdUrl, likedPostIds, actor)
    if (!post) return null

    const repliesObj = note.replies as { id?: string; totalItems?: number; first?: OrderedCollectionPage | string } | undefined
    if (repliesObj?.id) {
      try {
        const repliesCollection = await fetchResource<OrderedCollection>(repliesObj.id)
        if (repliesCollection.totalItems !== undefined) {
          post.repliesCount = repliesCollection.totalItems
        } else {
          let totalCount = 0
          let currentPage: OrderedCollectionPage | null = null
          
          // Get first page
          if (typeof repliesCollection.first === 'string') {
            currentPage = await fetchResource<OrderedCollectionPage>(repliesCollection.first)
          } else if (repliesCollection.first) {
            currentPage = repliesCollection.first as OrderedCollectionPage
          }
          
          // Count items from first page
          if (currentPage) {
            const items = (currentPage.orderedItems || currentPage.items || []) as unknown[]
            totalCount += items.length
            
            if (items.length === 0 && currentPage.next && typeof currentPage.next === 'string') {
              try {
                const nextPage = await fetchResource<OrderedCollectionPage>(currentPage.next)
                const nextItems = (nextPage.orderedItems || nextPage.items || []) as unknown[]
                totalCount += nextItems.length
                
                // Continue fetching pages if there are more
                let pageToFetch = nextPage.next
                while (pageToFetch && typeof pageToFetch === 'string' && totalCount < 1000) {
                  try {
                    const morePage = await fetchResource<OrderedCollectionPage>(pageToFetch)
                    const moreItems = (morePage.orderedItems || morePage.items || []) as unknown[]
                    totalCount += moreItems.length
                    pageToFetch = morePage.next
                  } catch {
                    break
                  }
                }
              } catch {
                // Continue with count from first page
              }
            } else if (items.length > 0 && currentPage.next && typeof currentPage.next === 'string') {
              // If first page has items and there's a next page, fetch it too
              try {
                const nextPage = await fetchResource<OrderedCollectionPage>(currentPage.next)
                const nextItems = (nextPage.orderedItems || nextPage.items || []) as unknown[]
                totalCount += nextItems.length
              } catch {
                // Continue with count from first page
              }
            }
          }
          
          post.repliesCount = totalCount
        }
      } catch {
        // Continue with existing count if fetch fails
      }
    }

    return post
  } catch (err) {
    // Rethrow so the UI can show the real reason (e.g. 401 signature required), not "Post not found"
    throw err
  }
}

export async function getPostRepliesDetails(
  noteIdUrl: string,
  params?: {
    page?: number
    limit?: number
    currentUsername?: string
    maxDepth?: number
  }
): Promise<{
  replies: Post[]
  totalItems: number
  next?: string | null
}> {
  const baseUrl = noteIdUrl
  const repliesId = `${noteIdUrl}/replies`
  const emptyReplies: OrderedCollection = {
    '@context': ACTIVITY_STREAMS_CONTEXT,
    type: 'OrderedCollection',
    id: repliesId,
    totalItems: 0,
    first: {
      '@context': ACTIVITY_STREAMS_CONTEXT,
      type: 'OrderedCollectionPage',
      id: repliesId,
      partOf: repliesId,
      orderedItems: [],
    },
  }

  // Fetch the Note first to check if it has embedded replies data
  let note: Note | null = null
  let repliesCollection: OrderedCollection
  try {
    note = await getPost(noteIdUrl)
    
    // Check if Note has replies with embedded first page that has items
    const noteReplies = note.replies as {
      id?: string
      type?: string
      first?: OrderedCollectionPage | string
      totalItems?: number
    } | undefined
    
    if (noteReplies && typeof noteReplies === 'object') {
      // Check if first page is embedded and has items
      const firstPageObj = typeof noteReplies.first === 'object' ? noteReplies.first : null
      const hasItemsInEmbedded = firstPageObj && (
        (Array.isArray(firstPageObj.orderedItems) && firstPageObj.orderedItems.length > 0) ||
        (Array.isArray(firstPageObj.items) && firstPageObj.items.length > 0)
      )
      
      // If embedded first page has items, construct collection from it
      // Otherwise fetch the replies collection URL
      if (hasItemsInEmbedded && noteReplies.id) {
        // Use embedded first page - construct collection from Note's replies
        repliesCollection = {
          '@context': 'https://www.w3.org/ns/activitystreams',
          type: (noteReplies.type || 'OrderedCollection') as 'OrderedCollection' | 'Collection',
          id: noteReplies.id,
          totalItems: noteReplies.totalItems || 0,
          first: firstPageObj,
        } as OrderedCollection
      } else if (noteReplies.id) {
        // Embedded first page is empty or missing - fetch the replies collection URL
        // Resolve relative URLs (remote servers may return e.g. "/users/1/statuses/2/replies") so we hit the correct origin
        const repliesId = resolveUrl(noteReplies.id, note?.id ?? baseUrl)
        const queryParams = new URLSearchParams()
        if (params?.page !== undefined) {
          if (params.page === 1) {
            queryParams.append('page', 'true')
          } else {
            queryParams.append('page', params.page.toString())
          }
        }
        if (params?.limit !== undefined) {
          queryParams.append('limit', params.limit.toString())
        }
        const query = queryParams.toString()
        const repliesUrl = query ? `${repliesId}?${query}` : repliesId
        repliesCollection = await fetchResource<OrderedCollection>(repliesUrl)
      } else {
        // No replies.id - use getPostReplies to construct URL
        repliesCollection = await getPostReplies(noteIdUrl, {
          page: params?.page,
          limit: params?.limit,
        })
      }
    } else {
      // No replies in Note - use getPostReplies only for local or /statuses/ URLs.
      if (noteIdUrl.includes('/objects/')) {
        repliesCollection = emptyReplies
      } else {
        repliesCollection = await getPostReplies(noteIdUrl, {
          page: params?.page,
          limit: params?.limit,
        })
      }
    }
  } catch {
    // Fallback: avoid getPostReplies for remote /objects/ URLs (server may return HTML)
    if (noteIdUrl.includes('/objects/')) {
      repliesCollection = emptyReplies
    } else {
      try {
        repliesCollection = await getPostReplies(noteIdUrl, {
          page: params?.page,
          limit: params?.limit,
        })
      } catch {
        repliesCollection = emptyReplies
      }
    }
  }

  let firstPage: OrderedCollectionPage | null = null
  if (typeof repliesCollection.first === 'string') {
    const firstPageUrl = resolveUrl(repliesCollection.first, baseUrl)
    try {
      firstPage = await fetchResource<OrderedCollectionPage>(firstPageUrl)
    } catch {
      firstPage = null
    }
  } else if (typeof repliesCollection.first === 'object' && repliesCollection.first) {
    const firstObj = repliesCollection.first as OrderedCollectionPage
    if (firstObj.id && typeof firstObj.id === 'string' && (!firstObj.items || firstObj.items.length === 0) && (!firstObj.orderedItems || firstObj.orderedItems.length === 0)) {
      try {
        const firstPageUrl = resolveUrl(firstObj.id, baseUrl)
        firstPage = await fetchResource<OrderedCollectionPage>(firstPageUrl)
      } catch {
        firstPage = firstObj
      }
    } else {
      firstPage = firstObj
    }
  }

  let replyItems = (firstPage?.orderedItems || firstPage?.items || []) as (string | Note)[]
  let nextPageUrl: string | null = null

  if (replyItems.length === 0 && firstPage?.next && typeof firstPage.next === 'string') {
    try {
      const nextPageUrlResolved = resolveUrl(firstPage.next, baseUrl)
      const nextPage = await fetchResource<OrderedCollectionPage>(nextPageUrlResolved)
      replyItems = (nextPage.orderedItems || nextPage.items || []) as (string | Note)[]
      // Update nextPageUrl from the fetched next page
      nextPageUrl = nextPage.next && typeof nextPage.next === 'string' ? resolveUrl(nextPage.next, baseUrl) : null
    } catch {
      // Continue with empty replyItems
    }
  } else {
    // Get next page URL for pagination from first page
    nextPageUrl = firstPage?.next && typeof firstPage.next === 'string' 
      ? resolveUrl(firstPage.next, baseUrl) 
      : null
  }
  
  // Extract URLs from items - items may be URLs (strings) or full Note objects
  const replyUrls = replyItems.map(item => {
    const url = typeof item === 'string' ? item : (item as Note).id || ''
    return url ? resolveUrl(url, baseUrl) : ''
  }).filter(url => url !== '')

  if (replyUrls.length === 0) {
    return { 
      replies: [], 
      totalItems: repliesCollection.totalItems || 0,
      next: nextPageUrl
    }
  }

  const likedPostIds = params?.currentUsername
    ? await fetchLikedPostIds(`${API_BASE}/u/${params.currentUsername}/liked`)
    : new Set<string>()

  const replies = await processInBatches(
    replyUrls,
    async (replyUrl: string) => {
      try {
        const note = await getPost(replyUrl)
        const noteId = note.id || replyUrl

        let actor: Actor | undefined
        if (note.attributedTo) {
          try {
            actor = await getActor(note.attributedTo as string)
          } catch {
            // Continue without actor data
          }
        }

        const likedPostIdsForReply = new Set([noteId])
        const post = transformNoteToPostDetail(
          note,
          replyUrl,
          likedPostIdsForReply,
          actor
        )

        if (!post) {
          return null
        }

        // Ensure noteId is set on the post
        const postWithNoteId = {
          ...post,
          noteId: post.noteId || noteId || replyUrl,
          isLiked: likedPostIds.has(noteId),
          inReplyTo: note.inReplyTo || null,
        } as Post

        return postWithNoteId
      } catch {
        return null
      }
    },
    10
  )

  const validReplies = replies.filter((reply): reply is Post => reply !== null)

  // Return only direct replies (no nested fetch). Deduplicate by noteId so the same reply URL
  // doesn't appear multiple times in the list.
  const seenIds = new Set<string>()
  const uniqueReplies: Post[] = []

  for (const reply of validReplies) {
    const noteId = reply.noteId || (reply.author_username && reply.guid
      ? `/u/${reply.author_username}/statuses/${reply.guid}`
      : null)
    if (!noteId) continue
    if (seenIds.has(noteId)) continue
    seenIds.add(noteId)
    uniqueReplies.push(reply)
  }

  return {
    replies: uniqueReplies,
    totalItems: repliesCollection.totalItems || uniqueReplies.length,
    next: nextPageUrl,
  }
}

// Fetch a specific page of replies (for pagination)
export async function getPostRepliesPage(
  pageUrl: string,
  params?: {
    currentUsername?: string
  }
): Promise<{
  replies: Post[]
  totalItems: number
  next?: string | null
}> {
  const page = await fetchResource<OrderedCollectionPage>(pageUrl)
  
  // Extract reply URLs from the page
  const replyItems = (page.orderedItems || page.items || []) as (string | Note)[]
  const replyUrls = replyItems.map(item => 
    typeof item === 'string' ? item : (item as Note).id || ''
  ).filter(url => url !== '')

  if (replyUrls.length === 0) {
    return {
      replies: [],
      totalItems: (page as OrderedCollectionPage & { totalItems?: number }).totalItems || 0,
      next: page.next && typeof page.next === 'string' ? page.next : null,
    }
  }

  const likedPostIds = params?.currentUsername
    ? await fetchLikedPostIds(`${API_BASE}/u/${params.currentUsername}/liked`)
    : new Set<string>()

  const replies = await processInBatches(
    replyUrls,
    async (replyUrl: string) => {
      try {
        const note = await getPost(replyUrl)
        const noteId = note.id || replyUrl

        let actor: Actor | undefined
        if (note.attributedTo) {
          try {
            actor = await getActor(note.attributedTo as string)
          } catch {
            // Continue without actor data
          }
        }

        const likedPostIdsForReply = new Set([noteId])
        const post = transformNoteToPostDetail(
          note,
          replyUrl,
          likedPostIdsForReply,
          actor
        )

        if (!post) {
          return null
        }

        return {
          ...post,
          noteId: post.noteId || noteId || replyUrl,
          isLiked: likedPostIds.has(noteId),
          inReplyTo: note.inReplyTo || null,
        } as Post
      } catch {
        return null
      }
    },
    10
  )

  const validReplies = replies.filter((reply): reply is Post => reply !== null)

  return {
    replies: validReplies,
    totalItems: (page as OrderedCollectionPage & { totalItems?: number }).totalItems || validReplies.length,
    next: page.next && typeof page.next === 'string' ? page.next : null,
  }
}

export async function getLikedPostsForUser(
  likedUrl: string,
  params?: {
    currentUsername?: string
  }
): Promise<{
  posts: Post[]
  totalItems: number
}> {
  const likedCollection = await getLiked(likedUrl)
  if (!likedCollection) {
    return { posts: [], totalItems: 0 }
  }
  const rawNoteIds = (likedCollection.orderedItems || []) as string[]
  const baseUrl = likedCollection.id || likedUrl
  const noteIds = rawNoteIds.map((id) =>
    id.startsWith('http://') || id.startsWith('https://')
      ? id
      : resolveUrl(id, baseUrl)
  )

  if (noteIds.length === 0) {
    return { posts: [], totalItems: likedCollection.totalItems || 0 }
  }

  const currentUserLikedPostIds = params?.currentUsername
    ? await fetchLikedPostIds(`${API_BASE}/u/${params.currentUsername}/liked`)
    : new Set<string>()

  const posts = await processInBatches(
    noteIds,
    async (likedNoteId: string) => {
      try {
        const note = await getPost(likedNoteId)

        if (note.inReplyTo) {
          return null
        }

        const likedPostIds = new Set([likedNoteId])
        const post = transformNoteToPostDetail(note, likedNoteId, likedPostIds)

        if (!post) {
          return null
        }

        const isLikedByCurrentUser =
          currentUserLikedPostIds.has(likedNoteId) ||
          (note.id && currentUserLikedPostIds.has(note.id))

        return {
          ...post,
          isLiked: isLikedByCurrentUser,
          noteId: likedNoteId,
        } as Post
      } catch {
        return null
      }
    },
    10
  )

  const validPosts = posts.filter((post): post is Post => post !== null)

  return {
    posts: validPosts,
    totalItems: validPosts.length,
  }
}


