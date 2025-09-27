// src/auth/adapters/security/JwtTokenServiceSimple.ts

import { sign, verify, decode, type SignOptions } from "jsonwebtoken";
import type {
  IJwtTokenService,
  AuthTokenPayload,
  DecodedToken,
} from "../../ports/out/services/IJwtTokenService";
import type { ITokenBlacklistRepository } from "../../ports/out/repository/ITokenBlacklistRepository";

export class JwtTokenServiceSimple implements IJwtTokenService {
  constructor(
    private readonly secret: string,
    private readonly tokenBlacklistRepository: ITokenBlacklistRepository,
  ) {}

  generateAuthToken(
    payload: AuthTokenPayload,
    expiresIn: string | number = "7d",
  ): string {
    return sign(payload, this.secret, { expiresIn } as SignOptions);
  }

  async verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
    try {
      const isBlacklisted =
        await this.tokenBlacklistRepository.isTokenBlacklisted(token);
      if (isBlacklisted) return null;

      const decoded = verify(token, this.secret);
      if (!decoded || typeof decoded !== "object") return null;

      return decoded as AuthTokenPayload;
    } catch {
      return null;
    }
  }

  decodeAuthToken(token: string): DecodedToken | null {
    try {
      const decoded = decode(token, { complete: true });

      if (!decoded || typeof decoded !== "object" || !("payload" in decoded)) {
        return null;
      }

      const payloadCandidate = (decoded as { payload: unknown }).payload;

      if (
        !payloadCandidate ||
        typeof payloadCandidate !== "object" ||
        !("exp" in payloadCandidate) ||
        typeof (payloadCandidate as { exp: unknown }).exp !== "number"
      ) {
        return null;
      }

      const payload = payloadCandidate as { [k: string]: unknown; exp: number };

      return {
        payload: payload as unknown as AuthTokenPayload,
        exp: payload.exp,
      };
    } catch {
      return null;
    }
  }
}

