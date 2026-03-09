// src/auth/auth.module.ts

// Export use case classes
export { LoginUser } from "./usecases/LoginUser";
export { LogoutUser } from "./usecases/LogoutUser";
export { RegisterUser } from "./usecases/RegisterUser";
export { GenerateInviteToken } from "./usecases/GenerateInviteToken";

// Export repositories
export { TokenBlacklistRepository } from "./adapters/db/repository/TokenBlacklistRepository";
export { InviteTokenRepository } from "./adapters/db/repository/InviteTokenRepository";
export { CredentialsRepository } from "./adapters/db/repository/CredentialsRepository";

// Export services
export { PasswordHasherService } from "./adapters/security/PasswordHasherService";
export { KeyPairGeneratorService } from "./adapters/security/KeyPairGeneratorService";
export { JwtTokenServiceSimple } from "./adapters/security/JwtTokenServiceSimple";
export { AuthGuard } from "./adapters/http/AuthGuard";

// Export schema functions
export { createCredentialsSchema } from "./adapters/db/models/CredentialsSchema";
export { createTokenBlacklistSchema } from "./adapters/db/models/TokenBlacklistSchema";
export { createInviteTokensSchema } from "./adapters/db/models/InviteTokenSchema";

// Export factory functions from di.ts
export {
  createCredentialsRepository,
  createTokenBlacklistRepository,
  createInviteTokenRepository,
  createPasswordHasherService,
  createKeyPairGeneratorService,
  createJwtTokenService,
  createAuthGuard,
  createAuthRoutes,
} from "./auth.di";

// Export types
export type { IGenerateInviteToken } from "./ports/in/IGenerateInviteToken";
export type { ICredentialsRepository } from "./ports/out/repository/ICredentialsRepository";
export type { IPasswordHasher } from "./ports/out/services/IPasswordHasher";
export type { IKeyPairGenerator } from "./ports/out/services/IKeyPairGenerator";
export type { CredentialsTable } from "./adapters/db/models/CredentialsSchema";
export type { TokenBlacklistTable } from "./adapters/db/models/TokenBlacklistSchema";
export type { InviteTokensTable } from "./adapters/db/models/InviteTokenSchema";
export type {
  AuthTokenPayload,
  IJwtTokenService,
} from "./ports/out/services/IJwtTokenService";
export type {
  IInviteTokenRepository,
  InviteTokenRecord,
} from "./ports/out/repository/IInviteTokenRepository";
export { CredentialsNotFoundError } from "./domain/AuthErrors";
