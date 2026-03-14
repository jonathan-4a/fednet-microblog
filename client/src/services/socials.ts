// src/services/socials.ts
import type {
  OrderedCollection,
  OrderedCollectionPage,
} from '../types/activitypub'
import { fetchResource } from './proxy'

// Helper to fetch collection and handle pagination (follow 'first' if items missing)
async function fetchCollection(url: string): Promise<OrderedCollection & { _collectionPrivate?: boolean }> {
  const data = await fetchResource<OrderedCollection & { _collectionPrivate?: boolean }>(url)

  // If collection is already marked private (403), return as-is
  if (data._collectionPrivate === true) {
    return data
  }

  const totalItems = (data as OrderedCollection).totalItems ?? 0
  const hasItems = (data.orderedItems?.length ?? 0) > 0
  const hasFirst = !!data.first

  if (totalItems > 0 && !hasItems && !hasFirst) {
    const firstPageUrl = url.includes('?') ? `${url}&page=1` : `${url}?page=1`
    try {
      const pageData = await fetchResource<OrderedCollectionPage & { _collectionPrivate?: boolean }>(
        firstPageUrl
      )
      if (pageData._collectionPrivate === true) {
        (data as OrderedCollection & { _collectionPrivate?: boolean })._collectionPrivate = true
        return data
      }
      if (pageData.orderedItems && pageData.orderedItems.length > 0) {
        data.orderedItems = pageData.orderedItems
        if (pageData.next) {
          (data as OrderedCollection & { next?: string }).next = pageData.next
        }
        return data
      }
    } catch (e) {
      const err = e as { status?: number }
      if (err && typeof err === 'object' && err.status === 403) {
        (data as OrderedCollection & { _collectionPrivate?: boolean })._collectionPrivate = true
        return data
      }
      // Other error: still treat as private if we can't load the list
      (data as OrderedCollection & { _collectionPrivate?: boolean })._collectionPrivate = true
      return data
    }
    // No items in page response → list is private
    (data as OrderedCollection & { _collectionPrivate?: boolean })._collectionPrivate = true
    return data
  }

  if ((!data.orderedItems || data.orderedItems.length === 0) && data.first) {
    let firstPageUrl: string | undefined

    if (typeof data.first === 'string') {
      firstPageUrl = data.first
    } else if (typeof data.first === 'object' && 'id' in data.first) {
      const page = data.first as OrderedCollectionPage
      if (page.orderedItems && page.orderedItems.length > 0) {
        data.orderedItems = page.orderedItems
        if (page.next) {
          ;(data as OrderedCollection & { next?: string }).next = page.next
        }
        return data
      }
      if (page.id) {
        firstPageUrl = page.id
      }
    }

    if (firstPageUrl) {
      try {
        const pageData = await fetchResource<OrderedCollectionPage & { _collectionPrivate?: boolean }>(
          firstPageUrl
        )
        if (pageData.orderedItems) {
          data.orderedItems = pageData.orderedItems
          // Preserve next page info from the first page
          if (pageData.next) {
            ;(data as OrderedCollection & { next?: string }).next =
              pageData.next
          }
        }
        if (pageData._collectionPrivate === true) {
          (data as OrderedCollection & { _collectionPrivate?: boolean })._collectionPrivate = true
        }
      } catch (e) {
        console.error('Failed to fetch first page of collection', e)
        // If the first page returned 403 (forbidden), treat collection as private
        const err = e as { status?: number }
        if (err && typeof err === 'object' && err.status === 403) {
          (data as OrderedCollection & { _collectionPrivate?: boolean })._collectionPrivate = true
        }
      }
    }
  }

  return data
}

// GET /u/{username}/followers
export async function getFollowers(
  followersUrl: string
): Promise<OrderedCollection> {
  return fetchCollection(followersUrl)
}

// GET /u/{username}/following
export async function getFollowing(
  followingUrl: string
): Promise<OrderedCollection> {
  return fetchCollection(followingUrl)
}

// Fetch a specific page of a collection (for pagination)
export async function getCollectionPage(
  pageUrl: string
): Promise<OrderedCollection | OrderedCollectionPage> {
  return fetchResource<OrderedCollection | OrderedCollectionPage>(pageUrl)
}

// GET /u/{username}/liked
export async function getLiked(likedUrl: string): Promise<OrderedCollection> {
  return fetchResource<OrderedCollection>(likedUrl)
}

