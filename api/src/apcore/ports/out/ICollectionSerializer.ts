// src/apcore/ports/out/ICollectionSerializer.ts

export interface ICollectionSerializer {
  createOrderedCollection(
    id: string,
    totalItems: number,
    items?: string[] | null,
    first?: string | null,
  ): Record<string, unknown>;

  createOrderedCollectionPage(
    id: string,
    partOf: string,
    items?: string[],
    next?: string | null,
    prev?: string | null,
  ): Record<string, unknown>;

  createCollection(
    id: string,
    totalItems: number,
    first?: Record<string, unknown> | null,
  ): Record<string, unknown>;

  createCollectionPage(
    id: string,
    partOf: string,
    items?: unknown[],
    next?: string | null,
    prev?: string | null,
  ): Record<string, unknown>;
}
