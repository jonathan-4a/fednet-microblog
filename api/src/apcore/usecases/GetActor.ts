// src/apcore/usecases/GetActor.ts

import type { IUserRepository } from "@users";
import type { ICredentialsRepository } from "@auth";
import type { IActorSerializer } from "../ports/out/IActorSerializer";
import type { GetActorInput, IGetActor } from "../ports/in/IGetActor";
import { InvalidResourceError } from "../domain/ActivityPubErrors";
import { NotFoundError } from "../domain/ActivityPubErrors";

export class GetActor implements IGetActor {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly credentialsRepository: ICredentialsRepository,
    private readonly actorSerializer: IActorSerializer,
  ) {}

  async execute(input: GetActorInput) {
    const { username, host, protocol } = input;

    const user = await this.userRepository.findUserByUsername(username);
    if (!user || !user.isActive) {
      throw new NotFoundError();
    }

    const credentials =
      await this.credentialsRepository.findCredentialsByUsername(username);
    if (!credentials || !credentials.publicKeyPem) {
      throw new InvalidResourceError("User credentials not found");
    }

    const published = user.createdAt
      ? new Date(user.createdAt * 1000).toISOString()
      : undefined;

    return this.actorSerializer.create(
      username,
      host,
      credentials.publicKeyPem,
      user.displayName,
      user.summary,
      protocol,
      published,
    );
  }
}
