// src/auth/usecases/RegisterUser.ts
import type { IUserRepository, CreateUserInput } from "@users";
import type { IGetServerSettings } from "@shared";
import type { ITransactionManager } from "@shared";
import type {
  IInviteTokenRepository,
  InviteTokenRecord,
} from "../ports/out/repository/IInviteTokenRepository";
import type { ICredentialsRepository } from "../ports/out/repository/ICredentialsRepository";
import type { IKeyPairGenerator } from "../ports/out/services/IKeyPairGenerator";
import type { IPasswordHasher } from "../ports/out/services/IPasswordHasher";
import type { Credentials } from "../domain/Credentials";
import type { IRegisterUser } from "../ports/in/IRegisterUser";
import type {
  RegisterUserInput,
  RegisterUserOutput,
} from "../ports/in/Auth.dto";
import {
  AuthValidationError,
  AuthConflictError,
  AuthBusinessRuleError,
} from "../domain/AuthErrors";

export class RegisterUser implements IRegisterUser {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly getServerSettings: IGetServerSettings,
    private readonly inviteTokenRepository: IInviteTokenRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly credentialsRepository: ICredentialsRepository,
    private readonly keyPairGenerator: IKeyPairGenerator,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    if (!input.password || input.password.length < 8) {
      throw new AuthValidationError("Password must be at least 8 characters");
    }

    const existing = await this.userRepository.findUserByUsername(
      input.username,
    );
    if (existing) {
      throw new AuthConflictError("Username is already taken");
    }

    const settings = await this.getServerSettings.execute({});
    let inviteRecord: InviteTokenRecord | undefined;

    if (settings.registration_mode === "invite") {
      inviteRecord = await this.resolveInvite(input.inviteToken);
    }
    // In open mode, inviteToken (if sent) is ignored

    await this.performRegistration(input, inviteRecord);

    return { success: true };
  }

  private async resolveInvite(token?: string): Promise<InviteTokenRecord> {
    const inviteToken = token?.trim();
    if (!inviteToken)
      throw new AuthBusinessRuleError("An invite token is required");

    const record = await this.inviteTokenRepository.findToken(inviteToken);
    if (!record || record.status !== "unused") {
      throw new AuthValidationError("Invalid or used invite token");
    }
    return record;
  }

  private async performRegistration(
    input: RegisterUserInput,
    inviteRecord?: InviteTokenRecord,
  ): Promise<void> {
    const { publicKey, privateKey } =
      await this.keyPairGenerator.generateKeyPair();
    const passwordHash = await this.passwordHasher.hashPassword(input.password);

    const userDto: CreateUserInput = {
      username: input.username,
      displayName: input.displayName,
      summary: input.summary,
      isActive: true,
      isAdmin: false,
      isFollowingPublic: true,
      createdAt: Math.floor(Date.now() / 1000),
    };

    const credentials: Credentials = {
      username: input.username,
      passwordHash,
      publicKeyPem: publicKey,
      privkey: privateKey,
    };

    await this.transactionManager.execute(async (trx) => {
      await this.userRepository.createUser(userDto, trx);

      await this.credentialsRepository.createCredentials(trx, credentials);

      if (inviteRecord) {
        const updated = await this.inviteTokenRepository.markTokenUsed(
          { token: inviteRecord.token, usedBy: input.username },
          trx,
        );
        if (!updated)
          throw new AuthBusinessRuleError("Failed to consume invite");
      }
    });
  }
}
