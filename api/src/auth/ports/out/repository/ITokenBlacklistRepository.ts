// src/auth/ports/out/repository/ITokenBlacklistRepository.ts

export interface ITokenBlacklistRepository {
  addToken(token: string, expiresAt: number): Promise<void>;
  isTokenBlacklisted(token: string): Promise<boolean>;
  cleanupExpiredTokens(): Promise<void>;
}
