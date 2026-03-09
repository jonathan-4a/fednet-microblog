// src/apcore/adapters/serializers/Actor.ts

import type {
  IActorSerializer,
  ActorDocument,
} from "../../ports/out/IActorSerializer";
import { ACTIVITY_STREAMS_CONTEXT } from "./ActivityStreamsContext";

export class Actor implements IActorSerializer {
  create(
    username: string,
    host: string,
    publicKey: string,
    name?: string,
    summary?: string,
    protocol = "https",
    published?: string,
  ): ActorDocument {
    const base = `${protocol}://${host}/u/${username}`;
    return {
      "@context": ACTIVITY_STREAMS_CONTEXT,
      id: base,
      type: "Person",
      preferredUsername: username,
      name: name || username,
      summary: summary || "",
      ...(published && { published }),
      inbox: `${base}/inbox`,
      outbox: `${base}/outbox`,
      followers: `${base}/followers`,
      following: `${base}/following`,
      liked: `${base}/liked`,
      publicKey: {
        id: `${base}#main-key`,
        owner: base,
        publicKeyPem: publicKey,
      },
    };
  }
}
