// src/apcore/adapters/serializers/Activity.ts

import type { IActivitySerializer } from "../../ports/out/IActivitySerializer";
import { ACTIVITY_STREAMS_CONTEXT } from "./ActivityStreamsContext";

export class Activity implements IActivitySerializer {
  createSimple(
    type: string,
    actorUrl: string,
    objectId: string | Record<string, unknown>,
    id: string,
    published?: string,
  ): Record<string, unknown> {
    return {
      "@context": ACTIVITY_STREAMS_CONTEXT,
      type,
      id,
      actor: actorUrl,
      object: objectId,
      published: published || new Date().toISOString(),
    };
  }

  createFollow(
    actorUrl: string,
    targetActor: string,
    id: string,
    published?: string,
  ): Record<string, unknown> {
    return this.createSimple("Follow", actorUrl, targetActor, id, published);
  }

  createUndoFollow(
    actorUrl: string,
    targetActor: string,
    id: string,
    published?: string,
  ): Record<string, unknown> {
    return {
      "@context": ACTIVITY_STREAMS_CONTEXT,
      type: "Undo",
      id,
      actor: actorUrl,
      object: { type: "Follow", actor: actorUrl, object: targetActor },
      published: published || new Date().toISOString(),
    };
  }

  createAccept(
    actorUrl: string,
    followBody: Record<string, unknown>,
    id: string,
    published?: string,
  ): Record<string, unknown> {
    return {
      "@context": ACTIVITY_STREAMS_CONTEXT,
      type: "Accept",
      id,
      actor: actorUrl,
      object: followBody,
      published: published || new Date().toISOString(),
    };
  }

  createCreate(
    actorUrl: string,
    noteObject: Record<string, unknown>,
    id: string,
    published?: string,
    follower?: string,
  ): Record<string, unknown> {
    const activity = this.createSimple(
      "Create",
      actorUrl,
      noteObject,
      id,
      published,
    );
    if (follower) {
      activity.cc = [follower];
    }
    return activity;
  }

  createLike(
    actorUrl: string,
    objectId: string,
    id: string,
    published?: string,
  ): Record<string, unknown> {
    return this.createSimple("Like", actorUrl, objectId, id, published);
  }

  createAnnounce(
    actorUrl: string,
    objectId: string,
    id: string,
    published?: string,
  ): Record<string, unknown> {
    return this.createSimple("Announce", actorUrl, objectId, id, published);
  }

  createUpdate(
    actorUrl: string,
    noteObject: Record<string, unknown>,
    id: string,
    published?: string,
  ): Record<string, unknown> {
    return this.createSimple("Update", actorUrl, noteObject, id, published);
  }

  createDelete(
    actorUrl: string,
    objectId: string,
    id: string,
    published?: string,
  ): Record<string, unknown> {
    return this.createSimple("Delete", actorUrl, objectId, id, published);
  }

  createBlock(
    actorUrl: string,
    targetActor: string,
    id: string,
    published?: string,
  ): Record<string, unknown> {
    return this.createSimple("Block", actorUrl, targetActor, id, published);
  }

  createUnblock(
    actorUrl: string,
    targetActor: string,
    id: string,
    published?: string,
  ): Record<string, unknown> {
    return {
      "@context": ACTIVITY_STREAMS_CONTEXT,
      type: "Undo",
      id,
      actor: actorUrl,
      object: { type: "Block", actor: actorUrl, object: targetActor },
      published: published || new Date().toISOString(),
    };
  }
}
