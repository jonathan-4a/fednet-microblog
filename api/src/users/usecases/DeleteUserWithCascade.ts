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
    throw new Error(
      "DOMAIN environment variable is required for user deletion",
    );
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
      await this.likesRepository.deleteByActor(actorUrl, trx);
      await this.likesRepository.deleteLikesOnActorPosts(actorUrl, trx);

      await this.announcesRepository.deleteByActor(actorUrl, trx);
      await this.announcesRepository.deleteAnnouncesOnActorPosts(actorUrl, trx);

      await this.followRepository.deleteAllByActor(actorUrl, trx);

      await this.postRepository.deleteByAuthor(username, actorUrl, trx);

      const deleted = await this.userRepository.deleteUser(username, trx);

      if (deleted === 0) {
        throw new NotFoundError();
      }
    });
  }
}
