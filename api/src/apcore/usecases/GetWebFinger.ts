// src/apcore/usecases/GetWebFinger.ts

import type { IUserRepository } from "@users";
import type { ICredentialsRepository } from "@auth";
import type { IWebFingerSerializer } from "../ports/out/IWebFingerSerializer";
import type {
  IGetWebFinger,
  GetWebFingerInput,
  WebFingerResponse,
} from "../ports/in/IGetWebFinger";
import { InvalidResourceError } from "../domain/ActivityPubErrors";
import { NotFoundError } from "../domain/ActivityPubErrors";
import { CredentialsNotFoundError } from "@auth";

export class GetWebFinger implements IGetWebFinger {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly credentialsRepository: ICredentialsRepository,
    private readonly webFingerSerializer: IWebFingerSerializer,
  ) {}

  async execute(input: GetWebFingerInput): Promise<WebFingerResponse> {
    const { resource, domain, protocol } = input;

    const match = resource.match(/^acct:([^@]+)@([^:]+)(?::(\d+))?$/);

    if (!match) {
      throw new InvalidResourceError("Invalid resource format");
    }

    const rUsername = match[1];
    const rDomain = match[2];
    const rPort = match[3];

    if (rDomain !== domain) {
      throw new InvalidResourceError(
        "Resource domain does not match server domain",
      );
    }

    const user = await this.userRepository.findUserByUsername(rUsername);
    if (!user || !user.isActive) {
      throw new NotFoundError("User not found");
    }

    const credentials =
      await this.credentialsRepository.findCredentialsByUsername(rUsername);
    if (!credentials || !credentials.publicKeyPem) {
      throw new CredentialsNotFoundError("User credentials not found");
    }

    return this.webFingerSerializer.create(
      rUsername,
      rDomain,
      protocol,
      rPort ?? undefined,
    );
  }
}

