// src/auth/usecases/LogoutUser.ts

import { AuthenticationError } from "../domain/AuthErrors";
import type { IJwtTokenService } from "../ports/out/services/IJwtTokenService";
import type { ITokenBlacklistRepository } from "../ports/out/repository/ITokenBlacklistRepository";
import type { ILogoutUser, LogoutUserInput } from "../ports/in/ILogoutUser";

export class LogoutUser implements ILogoutUser {
  constructor(
    private readonly jwtTokenService: IJwtTokenService,
    private readonly tokenBlacklistRepository: ITokenBlacklistRepository,
  ) {}

  async execute(input: LogoutUserInput): Promise<void> {
    const decoded = this.jwtTokenService.decodeAuthToken(input.token);

    if (!decoded) {
      throw new AuthenticationError("Invalid token");
    }

    const alreadyBlacklisted =
      await this.tokenBlacklistRepository.isTokenBlacklisted(input.token);
    if (alreadyBlacklisted) {
      throw new AuthenticationError("Token already invalid");
    }

    await this.tokenBlacklistRepository.addToken(input.token, decoded.exp);
  }
}

