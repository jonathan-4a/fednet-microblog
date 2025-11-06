// src/socials/usecases/GetFollowers.ts

import type { ICollectionSerializer } from "@apcore";
import type {
  GetFollowersInput,
  IGetFollowers,
} from "../ports/in/IGetFollowers";
import type { IFollowRepository } from "../ports/out/IFollowRepository";
import type { IUserRepository } from "@users";
import { UserNotFoundError } from "../domain/SocialsErrors";

export class GetFollowers implements IGetFollowers {
  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly userRepository: IUserRepository,
    private readonly collectionSerializer: ICollectionSerializer,
  ) {}

  async execute(input: GetFollowersInput): Promise<Record<string, unknown>> {
    const { username, host, protocol, page } = input;
    const PAGE_SIZE = 10;

    const user = await this.userRepository.findUserByUsername(username);
    if (!user || !user.isActive) {
      throw new UserNotFoundError("User not found");
    }

    const collectionId = `${protocol}://${host}/u/${username}/followers`;
    const followedActor = `${protocol}://${host}/u/${username}`;

    const records = await this.followRepository.getFollowers(followedActor);
    const actors = records.map((r) => r.actor);
    const totalItems = actors.length;

    if (!page) {
      return this.collectionSerializer.createOrderedCollection(
        collectionId,
        totalItems,
        null,
        `${collectionId}?page=1`,
      );
    }

    const pageNum = Number(page);

    const start = (pageNum - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pagedItems = actors.slice(start, end);

    const pageId = `${collectionId}?page=${pageNum}`;
    const next =
      end < totalItems ? `${collectionId}?page=${pageNum + 1}` : null;
    const prev = pageNum > 1 ? `${collectionId}?page=${pageNum - 1}` : null;

    return this.collectionSerializer.createOrderedCollectionPage(
      pageId,
      collectionId,
      pagedItems,
      next,
      prev,
    );
  }
}

