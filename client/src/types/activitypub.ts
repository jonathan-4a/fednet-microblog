// src/types/activitypub.ts
// ActivityStreams 2.0 context
export const ACTIVITY_STREAMS_CONTEXT = 'https://www.w3.org/ns/activitystreams'

// Public collection identifier
export const PUBLIC_COLLECTION = 'https://www.w3.org/ns/activitystreams#Public'

// Base ActivityPub object interface
export interface ActivityPubObject {
  '@context': string | string[]
  id?: string
  type: string
}

// Note object
export interface Note extends ActivityPubObject {
  type: 'Note'
  id: string
  attributedTo: string
  content: string
  published: string
  to?: string[]
  cc?: string[]
  inReplyTo?: string
  url?: string
  replies?: {
    id: string
    type: 'OrderedCollection' | 'Collection'
    totalItems?: number
    first: {
      type: 'OrderedCollectionPage' | 'CollectionPage'
      partOf: string
      orderedItems?: unknown[]
      items?: unknown[]
    }
  }
  likes?: {
    id: string
    type: 'OrderedCollection'
    totalItems: number
  }
  shares?: {
    id: string
    type: 'OrderedCollection'
    totalItems: number
  }
}

// Create activity
export interface CreateActivity extends ActivityPubObject {
  type: 'Create'
  id?: string
  actor: string
  object: Note | string
  published: string
  cc?: string[]
}

// Follow activity
export interface FollowActivity extends ActivityPubObject {
  type: 'Follow'
  actor: string
  object: string
}

// Undo activity (for unfollow)
export interface UndoActivity extends ActivityPubObject {
  type: 'Undo'
  actor: string
  object: FollowActivity
}

// Like activity
export interface LikeActivity extends ActivityPubObject {
  type: 'Like'
  actor: string
  object: string
}

// Announce activity (repost/share)
export interface AnnounceActivity extends ActivityPubObject {
  type: 'Announce'
  actor: string
  object: string
}

// Actor (Person) object
export interface Actor extends ActivityPubObject {
  type: 'Person'
  id: string
  preferredUsername: string
  name?: string
  summary?: string
  published?: string
  inbox: string
  outbox: string
  followers: string
  following: string
  liked: string
  publicKey: {
    id: string
    owner: string
    publicKeyPem: string
  }
}

// OrderedCollection (ActivityPub spec)
export interface OrderedCollection extends ActivityPubObject {
  type: 'OrderedCollection' | 'Collection'
  id: string
  totalItems?: number
  orderedItems?: unknown[]
  first?: OrderedCollectionPage | string
  last?: OrderedCollectionPage | string
}

export interface OrderedCollectionPage extends ActivityPubObject {
  type: 'OrderedCollectionPage' | 'CollectionPage'
  id: string
  partOf: string
  orderedItems?: unknown[]
  items?: unknown[]
  next?: string
  prev?: string
}

// Factory functions

export function createNote(params: {
  id: string
  actorUrl: string
  content: string
  published: string
  inReplyTo?: string
  to?: string[]
  cc?: string[]
}): Note {
  return {
    '@context': ACTIVITY_STREAMS_CONTEXT,
    type: 'Note',
    id: params.id,
    attributedTo: params.actorUrl,
    content: params.content,
    published: params.published,
    to: params.to || [PUBLIC_COLLECTION],
    cc: params.cc || [params.actorUrl],
    ...(params.inReplyTo && { inReplyTo: params.inReplyTo }),
    url: params.id,
  }
}

export function createCreateActivity(params: {
  id?: string
  actorUrl: string
  note: Note
  published?: string
  cc?: string[]
}): CreateActivity {
  return {
    '@context': ACTIVITY_STREAMS_CONTEXT,
    type: 'Create',
    ...(params.id && { id: params.id }),
    actor: params.actorUrl,
    object: params.note,
    published: params.published || new Date().toISOString(),
    ...(params.cc && { cc: params.cc }),
  }
}

export function createFollowActivity(params: {
  actorUrl: string
  targetActorUrl: string
}): FollowActivity {
  return {
    '@context': ACTIVITY_STREAMS_CONTEXT,
    type: 'Follow',
    actor: params.actorUrl,
    object: params.targetActorUrl,
  }
}

export function createUndoFollowActivity(params: {
  actorUrl: string
  targetActorUrl: string
}): UndoActivity {
  return {
    '@context': ACTIVITY_STREAMS_CONTEXT,
    type: 'Undo',
    actor: params.actorUrl,
    object: createFollowActivity({
      actorUrl: params.actorUrl,
      targetActorUrl: params.targetActorUrl,
    }),
  }
}

export function createLikeActivity(params: {
  actorUrl: string
  objectId: string
}): LikeActivity {
  return {
    '@context': ACTIVITY_STREAMS_CONTEXT,
    type: 'Like',
    actor: params.actorUrl,
    object: params.objectId,
  }
}

export function createAnnounceActivity(params: {
  actorUrl: string
  objectId: string
}): AnnounceActivity {
  return {
    '@context': ACTIVITY_STREAMS_CONTEXT,
    type: 'Announce',
    actor: params.actorUrl,
    object: params.objectId,
  }
}

// Accept activity
export interface AcceptActivity extends ActivityPubObject {
  type: 'Accept'
  actor: string
  object: FollowActivity | string
}

// Response interface types

export interface OutboxResponse extends Omit<OrderedCollection, 'first'> {
  first: OrderedCollectionPage & {
    orderedItems: Array<CreateActivity & { object: Note }>
  }
}

export interface WebFingerResponse {
  subject: string
  links?: Array<{
    rel: string
    type?: string
    href: string
  }>
}

