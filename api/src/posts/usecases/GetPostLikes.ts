import type { ICollectionSerializer } from "@apcore";
import type { IPostRepository } from "../ports/out/IPostRepository";
import type { ILikesRepository } from "../ports/out/ILikesRepository";
import type { IGetPostLikes } from "../ports/in/IGetPostLikes";
import type { GetPostLikesInput } from "../ports/in/Posts.dto";
import { PostNotFoundError } from "../domain/PostsErrors";

export class GetPostLikes implements IGetPostLikes {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly likesRepository: ILikesRepository,
    private readonly collectionSerializer: ICollectionSerializer,
  ) {}

  async execute(input: GetPostLikesInput): Promise<Record<string, unknown>> {
    const { guid, username, host, protocol, page = 1, limit = 20 } = input;

    const post = await this.postRepository.findByGuid(guid);
    if (!post) {
      throw new PostNotFoundError("Post not found");
    }

    if (post.authorUsername !== username) {
      throw new PostNotFoundError("Post author mismatch");
    }

    const noteId = `${protocol}://${host}/u/${username}#${guid}`;
    const collectionId = `${protocol}://${host}/u/${username}/statuses/${guid}/likes`;

    const likes = await this.likesRepository.getLikes(noteId, page, limit);
    const totalLikes = await this.likesRepository.countLikes(noteId);

    const likeActors = likes.map((like) => like.actor);
    const nextPage =
      page * limit < totalLikes
        ? `${collectionId}?page=${page + 1}&limit=${limit}`
        : null;

    const firstPage = this.collectionSerializer.createOrderedCollectionPage(
      collectionId,
      collectionId,
      likeActors,
      nextPage,
    );

    const collection = this.collectionSerializer.createOrderedCollection(
      collectionId,
      totalLikes,
    );
    collection.first = firstPage;
    return collection;
  }
}
