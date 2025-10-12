// src/users/usecases/DeleteUserWithCascade.ts

import type { IUserRepository } from "../ports/out/IUserRepository";
import type { IPostRepository } from "@posts";
import type { ILikesRepository } from "@posts";
import type { IAnnouncesRepository } from "@posts";
import type { IFollowRepository } from "@socials";
import type { ITransactionManager } from "@shared";
import { NotFoundError } from "../domain/UserErrors";

function getActorUrl(username: string): string {
  const domain = process.env.DOMAIN;
  const protocol = process.env.PROTOCOL ?? "https";
  const port = process.env.PORT;

  if (!domain) {
    throw new Error("DOMAIN environment variable is required for user deletion");
  }

  const host =
    port && port !== "80" && port !== "443" ? `${domain}:${port}` : domain;
  return `${protocol}://${host}/u/${username}`;
}

export interface IDeleteUserWithCascade {
  execute(input: { username: string }): Promise<void>;
}

export class DeleteUserWithCascade implements IDeleteUserWithCascade {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly postRepository: IPostRepository,
    private readonly likesRepository: ILikesRepository,
    private readonly announcesRepository: IAnnouncesRepository,
    private readonly followRepository: IFollowRepository,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute(input: { username: string }): Promise<void> {
    const { username } = input;
    const actorUrl = getActorUrl(username);

    await this.transactionManager.execute(async (trx) => {
      // 1. Delete user's likes (posts they liked)
      await this.likesRepository.deleteByActor(actorUrl, trx);

      // 2. Delete likes on user's posts (other people's likes on this user's content)
      await this.likesRepository.deleteLikesOnActorPosts(actorUrl, trx);

      // 3. Delete user's reposts/announces
      await this.announcesRepository.deleteByActor(actorUrl, trx);

      // 4. Delete announces of user's posts (other people reposting this user's content)
      await this.announcesRepository.deleteAnnouncesOnActorPosts(actorUrl, trx);

      // 5. Delete follow relationships (where user is follower or followed)
      await this.followRepository.deleteAllByActor(actorUrl, trx);

      // 6. Delete user's posts
      await this.postRepository.deleteByAuthor(username, actorUrl, trx);

      // 7. Delete user (credentials cascade via FK)
      const deleted = await this.userRepository.deleteUser(username, trx);

      if (deleted === 0) {
        throw new NotFoundError();
      }
    });
  }
}

