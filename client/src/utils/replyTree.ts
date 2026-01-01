import type { Post } from '../types/posts'

export interface ReplyNode extends Post {
  children: ReplyNode[]
}

/**
 * Normalize a URL/noteId for comparison by removing trailing slashes and query params
 */
function normalizeNoteId(noteId: string): string {
  try {
    const url = new URL(noteId)
    // Remove trailing slash from pathname
    const pathname = url.pathname.replace(/\/$/, '')
    return `${url.origin}${pathname}`
  } catch {
    // If it's not a valid URL, return as-is (might be a local path)
    return noteId.replace(/\/$/, '')
  }
}

/**
 * Check if two noteIds match, handling both full URLs and local paths
 */
function noteIdsMatch(id1: string | null, id2: string | null): boolean {
  if (!id1 || !id2) return false
  if (id1 === id2) return true
  
  // Try normalizing both URLs
  try {
    const normalized1 = normalizeNoteId(id1)
    const normalized2 = normalizeNoteId(id2)
    return normalized1 === normalized2
  } catch {
    return false
  }
}

export function buildReplyTree(
  replies: Post[],
  parentNoteId: string
): ReplyNode[] {
  const replyMap = new Map<string, ReplyNode>()
  const rootNodes: ReplyNode[] = []

  // First pass: create all nodes
  replies.forEach((reply) => {
    const noteId =
      reply.noteId || `/u/${reply.author_username}/statuses/${reply.guid}`

    replyMap.set(noteId, {
      ...reply,
      children: [],
    })
  })

  // Second pass: build the tree structure
  replies.forEach((reply) => {
    const noteId =
      reply.noteId || `/u/${reply.author_username}/statuses/${reply.guid}`
    const node = replyMap.get(noteId)

    if (!node) return

    let inReplyTo: string | null = reply.inReplyTo || null

    // Try to extract inReplyTo from raw_message if not set
    if (
      !inReplyTo &&
      reply.raw_message &&
      typeof reply.raw_message === 'object'
    ) {
      const raw = reply.raw_message as Record<string, unknown>
      if (typeof raw.inReplyTo === 'string') {
        inReplyTo = raw.inReplyTo
      }
    }

    // If no inReplyTo, it's a root reply
    if (!inReplyTo) {
      rootNodes.push(node)
      return
    }

    // Check if this is a direct reply to the parent post
    const isDirectReply = noteIdsMatch(inReplyTo, parentNoteId)

    if (isDirectReply) {
      rootNodes.push(node)
      return
    }

    // Try to find parent node in the map
    let parentNode: ReplyNode | undefined

    // First try exact match
    parentNode = replyMap.get(inReplyTo)

    // If not found, try matching by normalized URLs
    if (!parentNode) {
      for (const [mapNoteId, mapNode] of replyMap.entries()) {
        if (noteIdsMatch(mapNoteId, inReplyTo)) {
          parentNode = mapNode
          break
        }
      }
    }

    // If parent found, add as child; otherwise treat as root
    if (parentNode) {
      parentNode.children.push(node)
    } else {
      // Parent not in the fetched replies, treat as root reply
      rootNodes.push(node)
    }
  })

  // Sort by date (oldest first)
  const sortByDate = (nodes: ReplyNode[]): void => {
    nodes.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateA - dateB
    })
    nodes.forEach((node) => {
      if (node.children.length > 0) {
        sortByDate(node.children)
      }
    })
  }

  sortByDate(rootNodes)

  return rootNodes
}

