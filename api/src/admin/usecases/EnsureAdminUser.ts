// src/admin/usecases/EnsureAdminUser.ts

import type { IUserRepository } from "@users";
import type { CreateUserInput } from "@users";
import type { ICredentialsRepository } from "@auth";
import type { IPasswordHasher, IKeyPairGenerator } from "@auth";
import type { ITransactionManager } from "@shared";
import type { IEnsureAdminUser } from "../ports/in/IEnsureAdminUser";
import type { EnsureAdminUserInput } from "../ports/in/Admin.dto";

export class EnsureAdminUser implements IEnsureAdminUser {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly credentialsRepository: ICredentialsRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly keyPairGenerator: IKeyPairGenerator,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute(input: EnsureAdminUserInput): Promise<void> {
    const existing = await this.userRepository.findUserByUsername(
      input.username,
    );

    if (existing) {
      if (existing.isAdmin && existing.isActive) {
        return;
      }

      await this.userRepository.updateUserFlags({
        username: input.username,
        isAdmin: true,
        isActive: true,
      });
      console.log(`Re-activated admin user ${input.username}`);
      return;
    }

    const { publicKey, privateKey } =
      await this.keyPairGenerator.generateKeyPair();
    const passwordHash = await this.passwordHasher.hashPassword(input.password);
    const createdAt = Math.floor(Date.now() / 1000);

    const userInput: CreateUserInput = {
      username: input.username,
      displayName: input.displayName ?? input.username,
      summary: input.summary ?? "",
      isActive: true,
      isAdmin: true,
      isFollowingPublic: true,
      createdAt,
    };

    await this.transactionManager.execute(async (trx) => {
      await this.userRepository.createUser(userInput, trx);
      await this.credentialsRepository.createCredentials(trx, {
        username: input.username,
        passwordHash,
        publicKeyPem: publicKey,
        privkey: privateKey,
      });
    });

    console.log(`Created admin user ${input.username}`);
  }
}

