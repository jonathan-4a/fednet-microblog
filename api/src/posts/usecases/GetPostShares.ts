import type { ICollectionSerializer } from "@apcore";
import type { IPostRepository } from "../ports/out/IPostRepository";
import type { IAnnouncesRepository } from "../ports/out/IAnnouncesRepository";
import type { IGetPostShares } from "../ports/in/IGetPostShares";
import type { GetPostSharesInput } from "../ports/in/Posts.dto";
import { PostNotFoundError } from "../domain/PostsErrors";

export class GetPostShares implements IGetPostShares {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly announcesRepository: IAnnouncesRepository,
    private readonly collectionSerializer: ICollectionSerializer,
  ) {}

  async execute(input: GetPostSharesInput): Promise<Record<string, unknown>> {
    const { guid, username, host, protocol, page = 1, limit = 20 } = input;

    const post = await this.postRepository.findByGuid(guid);
    if (!post) {
      throw new PostNotFoundError("Post not found");
    }

    if (post.authorUsername !== username) {
      throw new PostNotFoundError("Post author mismatch");
    }

    const noteId = `${protocol}://${host}/u/${username}/statuses/${guid}`;
    const collectionId = `${protocol}://${host}/u/${username}/statuses/${guid}/shares`;

    const announces = await this.announcesRepository.getAnnounces(
      noteId,
      page,
      limit,
    );
    const totalShares = await this.announcesRepository.countAnnounces(noteId);

    const shareActors = announces.map((announce) => announce.actor);
    const nextPage =
      page * limit < totalShares
        ? `${collectionId}?page=${page + 1}&limit=${limit}`
        : null;

    const firstPage = this.collectionSerializer.createOrderedCollectionPage(
      collectionId,
      collectionId,
      shareActors,
      nextPage,
    );

    const collection = this.collectionSerializer.createOrderedCollection(
      collectionId,
      totalShares,
    );
    collection.first = firstPage;
    return collection;
  }
}

