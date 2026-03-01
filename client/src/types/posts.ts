// src/types/posts.ts
export interface PostCollection {
  '@context': string | string[]
  id: string
  type: 'OrderedCollection'
  totalItems: number
  first: {
    id: string
    type: 'OrderedCollectionPage'
    partOf: string
    orderedItems: string[]
    next?: string | null
  }
}

export interface Post {
  guid: string
  author_username: string
  author_name?: string
  content: string
  created_at: string
  raw_message: object | null
  likesCount?: number
  repliesCount?: number
  sharesCount?: number
  isLiked?: boolean
  noteId?: string
  inReplyTo?: string | null
  isRemote?: boolean
  /** True when this post is a boost/repost; the author is the original author, repostedBy is who boosted it */
  isRepost?: boolean
  repostedBy?: string
}

export interface CreatePostRequest {
  content: string
  inReplyTo?: string | null
}

export interface CreatePostResponse {
  status: string
}

export interface UpdatePostRequest {
  content: string
}

export interface UpdatePostResponse {
  updated: boolean
}

export interface DeletePostResponse {
  deleted: boolean
}



