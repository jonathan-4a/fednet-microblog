// src/apcore/adapters/serializers/Note.ts

import type { INoteSerializer } from "../../ports/out/INoteSerializer";
import { ACTIVITY_STREAMS_CONTEXT } from "./ActivityStreamsContext";

export class Note implements INoteSerializer {
  create(
    noteId: string,
    actorUrl: string,
    content: string,
    published: string,
    inReplyTo: string | null = null,
    domain: string | null = null,
    protocol: string | null = null,
    likesCount = 0,
    shareCount = 0,
  ): Record<string, unknown> {
    const note: Record<string, unknown> = {
      "@context": ACTIVITY_STREAMS_CONTEXT,
      id: noteId,
      type: "Note",
      published,
      attributedTo: actorUrl,
      content,
      to: ["https://www.w3.org/ns/activitystreams#Public"],
      cc: [`${actorUrl}/followers`],
      url: noteId,
    };

    if (inReplyTo) {
      note.inReplyTo = inReplyTo;
    }

    if (domain && protocol) {
      note.replies = {
        id: `${noteId}/replies`,
        type: "OrderedCollection",
        first: {
          type: "OrderedCollectionPage",
          partOf: `${noteId}/replies`,
          orderedItems: [],
        },
      };

      note.likes = {
        id: `${noteId}/likes`,
        type: "OrderedCollection",
        totalItems: likesCount,
      };

      note.shares = {
        id: `${noteId}/shares`,
        type: "OrderedCollection",
        totalItems: shareCount,
      };
    }

    return note;
  }
}

