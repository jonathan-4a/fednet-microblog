// src/apcore/ports/out/IActivitySerializer.ts

export interface IActivitySerializer {
  createSimple(
    type: string,
    actorUrl: string,
    objectId: string | Record<string, unknown>,
    id: string,
    published?: string,
  ): Record<string, unknown>;

  createFollow(
    actorUrl: string,
    targetActor: string,
    id: string,
    published?: string,
  ): Record<string, unknown>;

  createUndoFollow(
    actorUrl: string,
    targetActor: string,
    id: string,
    published?: string,
  ): Record<string, unknown>;

  createAccept(
    actorUrl: string,
    followBody: Record<string, unknown>,
    id: string,
    published?: string,
  ): Record<string, unknown>;

  createCreate(
    actorUrl: string,
    noteObject: Record<string, unknown>,
    id: string,
    published?: string,
    follower?: string,
  ): Record<string, unknown>;

  createLike(
    actorUrl: string,
    objectId: string,
    id: string,
    published?: string,
  ): Record<string, unknown>;

  createAnnounce(
    actorUrl: string,
    objectId: string,
    id: string,
    published?: string,
  ): Record<string, unknown>;

  createUpdate(
    actorUrl: string,
    noteObject: Record<string, unknown>,
    id: string,
    published?: string,
  ): Record<string, unknown>;

  createDelete(
    actorUrl: string,
    objectId: string,
    id: string,
    published?: string,
  ): Record<string, unknown>;

  createBlock(
    actorUrl: string,
    targetActor: string,
    id: string,
    published?: string,
  ): Record<string, unknown>;

  createUnblock(
    actorUrl: string,
    targetActor: string,
    id: string,
    published?: string,
  ): Record<string, unknown>;
}
