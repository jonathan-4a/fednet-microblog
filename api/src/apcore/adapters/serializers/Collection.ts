// src/apcore/adapters/serializers/Collection.ts

import type { ICollectionSerializer } from "../../ports/out/ICollectionSerializer";
import { ACTIVITY_STREAMS_CONTEXT } from "./ActivityStreamsContext";

export class Collection implements ICollectionSerializer {
  createOrderedCollection(
    id: string,
    totalItems: number,
    items: string[] | null = null,
    first: string | null = null,
  ): Record<string, unknown> {
    const collection: Record<string, unknown> = {
      "@context": ACTIVITY_STREAMS_CONTEXT,
      type: "OrderedCollection",
      id,
      totalItems,
    };
    if (first) {
      collection.first = first;
    }
    if (Array.isArray(items)) {
      collection.orderedItems = items;
    }
    return collection;
  }

  createOrderedCollectionPage(
    id: string,
    partOf: string,
    items: string[] = [],
    next: string | null = null,
    prev: string | null = null,
  ): Record<string, unknown> {
    const page: Record<string, unknown> = {
      "@context": ACTIVITY_STREAMS_CONTEXT,
      type: "OrderedCollectionPage",
      id,
      partOf,
      orderedItems: items,
    };
    if (next) page.next = next;
    if (prev) page.prev = prev;
    return page;
  }

  createCollection(
    id: string,
    totalItems: number,
    first: Record<string, unknown> | null = null,
  ): Record<string, unknown> {
    const collection: Record<string, unknown> = {
      "@context": ACTIVITY_STREAMS_CONTEXT,
      type: "Collection",
      id,
      totalItems,
    };
    if (first) collection.first = first;
    return collection;
  }

  createCollectionPage(
    id: string,
    partOf: string,
    items: unknown[] = [],
    next: string | null = null,
    prev: string | null = null,
  ): Record<string, unknown> {
    const page: Record<string, unknown> = {
      "@context": ACTIVITY_STREAMS_CONTEXT,
      type: "CollectionPage",
      id,
      partOf,
      items,
    };
    if (next) page.next = next;
    if (prev) page.prev = prev;
    return page;
  }
}
