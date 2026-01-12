import { apiRequest } from '../apiClient'
import { API_BASE } from '../../config'
import { useAuthStore } from '../../stores/authStore'
import {
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
import { fetchResource, fetchLikedPostIds, processInBatches, resolveUrl } from './utils'
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
  // Mastodon uses ?page=true format, ActivityPub spec uses ?page=1
  // For Mastodon compatibility, if page is 1, use ?page=true
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

    // Fetch replies collection to get accurate count (Mastodon doesn't include totalItems in Note)
    const repliesObj = note.replies as { id?: string; totalItems?: number; first?: OrderedCollectionPage | string } | undefined
    if (repliesObj?.id) {
      try {
        const repliesCollection = await fetchResource<OrderedCollection>(repliesObj.id)
        if (repliesCollection.totalItems !== undefined) {
          post.repliesCount = repliesCollection.totalItems
        } else {
          // Mastodon doesn't provide totalItems, count items from pages
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
            
            // If first page is empty but has next, fetch next page (Mastodon pattern)
            // Mastodon uses only_other_accounts=true for replies from other accounts
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
  } catch {
    return null
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
  // Base URL for resolving relative URLs from remote servers (e.g. Mastodon)
  const baseUrl = noteIdUrl

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
      // No replies in Note - use getPostReplies to construct URL
      repliesCollection = await getPostReplies(noteIdUrl, {
        page: params?.page,
        limit: params?.limit,
      })
    }
  } catch {
    // Fallback: use getPostReplies which will construct the URL
    repliesCollection = await getPostReplies(noteIdUrl, {
    page: params?.page,
    limit: params?.limit,
  })
  }

  // Handle both embedded first page object and URL string (Mastodon format)
  let firstPage: OrderedCollectionPage | null = null
  if (typeof repliesCollection.first === 'string') {
    // Mastodon returns first as a URL string - resolve if relative, then fetch
    const firstPageUrl = resolveUrl(repliesCollection.first, baseUrl)
    try {
      firstPage = await fetchResource<OrderedCollectionPage>(firstPageUrl)
    } catch {
      firstPage = null
    }
  } else if (typeof repliesCollection.first === 'object' && repliesCollection.first) {
    // Check if first page object has an 'id' field (Mastodon format)
    // If it does and items is empty, fetch the URL to get the actual page
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

  // Mastodon uses 'items', ActivityPub spec uses 'orderedItems'
  // Mastodon may embed full Note objects in items array, or just URLs
  let replyItems = (firstPage?.orderedItems || firstPage?.items || []) as (string | Note)[]
  let nextPageUrl: string | null = null
  
  // If first page has no items but has a 'next' URL (Mastodon's only_other_accounts page),
  // fetch that to get replies from other accounts
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

  const fetchedReplyIds = new Set<string>()
  const processedNestedReplies = new Set<string>()
  const maxDepth = params?.maxDepth ?? 3

  const getNoteId = (reply: Post): string | null => {
    if (!reply.noteId) {
      // Fallback: build noteId from author_username and guid if missing
      if (reply.author_username && reply.guid) {
        return `/u/${reply.author_username}/statuses/${reply.guid}`
      }
      return null
    }
    return reply.noteId
  }

  const allReplies: Post[] = []
  for (const reply of validReplies) {
    const noteId = getNoteId(reply)
    if (!noteId) {
      // Skip replies without valid noteId
      continue
    }
    if (!fetchedReplyIds.has(noteId)) {
      allReplies.push(reply)
      fetchedReplyIds.add(noteId)
    }
  }

  const fetchNestedReplies = async (
    reply: Post,
    currentDepth: number = 0
  ): Promise<void> => {
    if (
      currentDepth >= maxDepth ||
      !reply.repliesCount ||
      reply.repliesCount === 0
    ) {
      return
    }

    const noteId = getNoteId(reply)
    if (!noteId) {
      return
    }

    if (processedNestedReplies.has(noteId)) {
      return
    }

    processedNestedReplies.add(noteId)

    try {
      const noteIdToUse =
        reply.noteId ||
        (reply.author_username && reply.guid
          ? `/u/${reply.author_username}/statuses/${reply.guid}`
          : null)
      if (!noteIdToUse) {
        return
      }
      const repliesCollection = await getPostReplies(noteIdToUse, {
        page: 1,
        limit: 100,
      })

      const firstPage =
        typeof repliesCollection.first === 'object' && repliesCollection.first
          ? repliesCollection.first
          : null
      // Mastodon uses 'items', ActivityPub spec uses 'orderedItems'
      const nestedReplyUrls = ((firstPage?.orderedItems || firstPage?.items || []) as string[])

      if (nestedReplyUrls.length === 0) {
        return
      }

      const nestedReplies = await processInBatches(
        nestedReplyUrls,
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

      const nestedRepliesData = {
        replies: nestedReplies.filter((r): r is Post => r !== null),
        totalItems: nestedReplies.length,
      }

      const repliesToProcess: Post[] = []

      for (const nestedReply of nestedRepliesData.replies) {
        const nestedNoteId = getNoteId(nestedReply)
        if (!nestedNoteId) {
          continue
        }

        if (!fetchedReplyIds.has(nestedNoteId)) {
          allReplies.push(nestedReply)
          fetchedReplyIds.add(nestedNoteId)
        }

        if (
          nestedReply.repliesCount &&
          nestedReply.repliesCount > 0 &&
          currentDepth + 1 < maxDepth
        ) {
          repliesToProcess.push(nestedReply)
        }
      }

      await processInBatches(
        repliesToProcess,
        (nestedReply) => fetchNestedReplies(nestedReply, currentDepth + 1),
        5
      )
    } catch {
      // Ignore errors when fetching nested replies
    }
  }

  await processInBatches(
    validReplies,
    (reply) => fetchNestedReplies(reply, 0),
    5
  )

  return {
    replies: allReplies,
    totalItems: repliesCollection.totalItems || validReplies.length,
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
  const { getLiked } = await import('../socials')
  const likedCollection = await getLiked(likedUrl)
  if (!likedCollection) {
    return { posts: [], totalItems: 0 }
  }
  const noteIds = (likedCollection.orderedItems || []) as string[]

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
    totalItems: likedCollection.totalItems || validPosts.length,
  }
}


