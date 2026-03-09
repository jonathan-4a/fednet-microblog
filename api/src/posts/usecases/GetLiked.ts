// src/posts/usecases/GetLiked.ts

import type { ICollectionSerializer } from "@apcore";
import type { IGetLiked } from "../ports/in/IGetLiked";
import type { GetLikedInput } from "../ports/in/Posts.dto";
import type { ILikesRepository } from "../ports/out/ILikesRepository";
import type { IUserRepository } from "@users";
import { PostNotFoundError } from "../domain/PostsErrors";

export class GetLiked implements IGetLiked {
  constructor(
    private readonly likesRepository: ILikesRepository,
    private readonly userRepository: IUserRepository,
    private readonly collectionSerializer: ICollectionSerializer,
  ) {}

  async execute(input: GetLikedInput): Promise<Record<string, unknown>> {
    const { username, host, protocol } = input;

    const user = await this.userRepository.findUserByUsername(username);
    if (!user || !user.isActive) {
      throw new PostNotFoundError("User not found");
    }

    const actorUrl = `${protocol}://${host}/u/${username}`;
    const collectionId = `${actorUrl}/liked`;

    const records = await this.likesRepository.getLikedByActor(actorUrl);
    const objectIds = records.map((r) => r.objectId);

    return this.collectionSerializer.createOrderedCollection(
      collectionId,
      objectIds.length,
      objectIds,
    );
  }
}
