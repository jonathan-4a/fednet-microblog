// src/apcore/ports/out/INoteSerializer.ts

export interface INoteSerializer {
  create(
    noteId: string,
    actorUrl: string,
    content: string,
    published: string,
    inReplyTo?: string | null,
    domain?: string | null,
    protocol?: string | null,
    likesCount?: number,
    shareCount?: number,
  ): Record<string, unknown>;
}

