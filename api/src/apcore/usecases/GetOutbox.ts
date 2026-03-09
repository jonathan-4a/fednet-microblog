// src/apcore/usecases/GetOutbox.ts

import type { INoteSerializer } from "../ports/out/INoteSerializer";
import type { ICollectionSerializer } from "../ports/out/ICollectionSerializer";
import type { IGetOutbox, GetOutboxInput } from "../ports/in/IGetOutbox";
import type {
  IPostRepository,
  ILikesRepository,
  IAnnouncesRepository,
} from "@posts";
import type { PostRecord } from "@posts";
import type { AnnouncedRecord } from "@posts";
import type { IUserRepository } from "@users";
import { NotFoundError } from "../domain/ActivityPubErrors";

type OutboxEntry =
  | { kind: "Create"; createdAt: number; post: PostRecord }
  | { kind: "Announce"; createdAt: number; objectId: string };

export class GetOutbox implements IGetOutbox {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly userRepository: IUserRepository,
    private readonly likesRepository: ILikesRepository,
    private readonly announcesRepository: IAnnouncesRepository,
    private readonly noteSerializer: INoteSerializer,
    private readonly collectionSerializer: ICollectionSerializer,
  ) {}

  async execute(input: GetOutboxInput): Promise<Record<string, unknown>> {
    const { username, host, protocol, page = 1, limit = 20 } = input;

    const user = await this.userRepository.findUserByUsername(username);
    if (!user || !user.isActive) {
      throw new NotFoundError();
    }

    const actorUrl = `${protocol}://${host}/u/${username}`;
    const collectionId = `${actorUrl}/outbox`;

    const needTotal = page * limit + 1;
    const [posts, reposts] = await Promise.all([
      this.postRepository.findByAuthorIncludingReplies(actorUrl, needTotal, 0),
      this.announcesRepository.getAnnouncedByActorPaginated(
        actorUrl,
        needTotal,
        0,
      ),
    ]);

    const entries: OutboxEntry[] = [
      ...posts.map((post) => ({
        kind: "Create" as const,
        createdAt: post.createdAt,
        post,
      })),
      ...reposts.map((r: AnnouncedRecord) => ({
        kind: "Announce" as const,
        createdAt: r.createdAt,
        objectId: r.objectId,
      })),
    ];
    entries.sort((a, b) => b.createdAt - a.createdAt);

    const totalCount =
      (await this.postRepository.countByAuthorIncludingReplies(actorUrl)) +
      (await this.announcesRepository.countByActor(actorUrl));

    const start = (page - 1) * limit;
    const pageEntries = entries.slice(start, start + limit);
    const hasMore = entries.length > start + limit;

    const activities = await Promise.all(
      pageEntries.map(async (entry) => {
        if (entry.kind === "Announce") {
          const publishedIso = new Date(entry.createdAt * 1000).toISOString();
          const activityId = `${actorUrl}/announces/${encodeURIComponent(entry.objectId)}#${entry.createdAt}`;
          return {
            "@context": "https://www.w3.org/ns/activitystreams",
            type: "Announce",
            id: activityId,
            actor: actorUrl,
            object: entry.objectId,
            published: publishedIso,
          };
        }

        const post = entry.post;
        const noteId =
          post.noteId ??
          `${protocol}://${host}/u/${username}/statuses/${post.guid}`;
        const publishedIso = new Date(post.createdAt * 1000).toISOString();

        const likesCount = await this.likesRepository.countLikes(noteId);
        const sharesCount =
          await this.announcesRepository.countAnnounces(noteId);
        const repliesCount = await this.postRepository.countByInReplyTo(noteId);

        const note = this.noteSerializer.create(
          noteId,
          actorUrl,
          post.content,
          publishedIso,
          post.inReplyTo,
          host,
          protocol,
          likesCount,
          sharesCount,
        );

        if (note.replies && typeof note.replies === "object") {
          (note.replies as Record<string, unknown>).totalItems = repliesCount;
        }

        return {
          "@context": "https://www.w3.org/ns/activitystreams",
          type: "Create",
          id: `${noteId}#create`,
          actor: actorUrl,
          published: publishedIso,
          object: note,
        };
      }),
    );

    const pageId = `${collectionId}?page=${page}&limit=${limit}`;
    const nextPage = hasMore
      ? `${collectionId}?page=${page + 1}&limit=${limit}`
      : null;

    const firstPage: Record<string, unknown> = {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "OrderedCollectionPage",
      id: pageId,
      partOf: collectionId,
      orderedItems: activities,
    };
    if (nextPage) {
      firstPage.next = nextPage;
    }

    const collection = this.collectionSerializer.createOrderedCollection(
      collectionId,
      totalCount,
    );
    collection.first = firstPage;

    return collection;
  }
}
