// src/socials/usecases/GetFollowing.ts

import type { ICollectionSerializer } from "@apcore";
import type {
  GetFollowingInput,
  IGetFollowing,
} from "../ports/in/IGetFollowing";
import type { IFollowRepository } from "../ports/out/IFollowRepository";
import type { IUserRepository } from "@users";
import { UserNotFoundError } from "../domain/SocialsErrors";

export class GetFollowing implements IGetFollowing {
  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly userRepository: IUserRepository,
    private readonly collectionSerializer: ICollectionSerializer,
  ) {}

  async execute(input: GetFollowingInput): Promise<Record<string, unknown>> {
    const { username, host, protocol, page } = input;
    const PAGE_SIZE = 10;

    // Verify user exists before returning collection
    const user = await this.userRepository.findUserByUsername(username);
    if (!user || !user.isActive) {
      throw new UserNotFoundError("User not found");
    }

    const collectionId = `${protocol}://${host}/u/${username}/following`;
    const followerActor = `${protocol}://${host}/u/${username}`;

    const records = await this.followRepository.getFollowing(followerActor);
    const actors = records.map((r) => r.actor);
    const totalItems = actors.length;

    if (!page) {
      // Return main collection with link to first page
      return this.collectionSerializer.createOrderedCollection(
        collectionId,
        totalItems,
        null, // No items inline
        `${collectionId}?page=1`, // Link to first page
      );
    }

    // Return specific page
    const pageNum = Number(page);
    if (isNaN(pageNum) || pageNum < 1) {
      // Fallback or error?
    }

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

