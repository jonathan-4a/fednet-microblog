import type { IUserRepository, CreateUserInput } from "@users";

import { AuthenticationError } from "../domain/AuthErrors";
import type { ICredentialsRepository } from "../ports/out/repository/ICredentialsRepository";
import type { Credentials } from "../domain/Credentials";
import type { IPasswordHasher } from "../ports/out/services/IPasswordHasher";
import type { IJwtTokenService } from "../ports/out/services/IJwtTokenService";
import type { ILoginUser } from "../ports/in/ILoginUser";
import type { LoginUserInput, LoginUserOutput } from "../ports/in/Auth.dto";

export class LoginUser implements ILoginUser {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly credentialsRepository: ICredentialsRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly jwtTokenService: IJwtTokenService,
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    const user: CreateUserInput | undefined =
      await this.userRepository.findUserByUsername(input.username);
    if (!user) {
      throw new AuthenticationError("Authentication failed");
    }

    if (!user.isActive) {
      throw new AuthenticationError("Authentication failed");
    }

    const creds: Credentials | undefined =
      await this.credentialsRepository.findCredentialsByUsername(
        input.username,
      );
    if (!creds || !creds.passwordHash) {
      throw new AuthenticationError("Authentication failed");
    }

    const passwordHash: string = creds.passwordHash;
    const ok = await this.passwordHasher.verifyPassword(
      input.password,
      passwordHash,
    );
    if (!ok) {
      throw new AuthenticationError("Authentication failed");
    }

    const isAdmin = user.isAdmin;
    const isActive = user.isActive;

    const token = this.jwtTokenService.generateAuthToken({
      username: user.username,
      address: `${user.username}@${input.domain}`,
      is_admin: isAdmin,
      is_active: isActive,
    });

    return {
      token,
      user: {
        username: user.username,
        displayName: user.displayName,
        summary: user.summary,
        isAdmin: isAdmin,
        isActive: isActive,
        isFollowingPublic: user.isFollowingPublic,
        createdAt: user.createdAt,
      },
    };
  }
}

