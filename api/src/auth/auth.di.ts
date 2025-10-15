// src/auth/auth.di.ts

import type { Kysely } from "kysely";
import type { ITransactionManager, IGetServerSettings } from "@shared";
import { IUserRepository } from "@users";

import { LoginUser } from "./usecases/LoginUser";
import { LogoutUser } from "./usecases/LogoutUser";
import { RegisterUser } from "./usecases/RegisterUser";
import { GenerateInviteToken } from "./usecases/GenerateInviteToken";

import { TokenBlacklistRepository } from "./adapters/db/repository/TokenBlacklistRepository";
import { InviteTokenRepository } from "./adapters/db/repository/InviteTokenRepository";
import { CredentialsRepository } from "./adapters/db/repository/CredentialsRepository";

import { PasswordHasherService } from "./adapters/security/PasswordHasherService";
import { KeyPairGeneratorService } from "./adapters/security/KeyPairGeneratorService";
import { JwtTokenServiceSimple } from "./adapters/security/JwtTokenServiceSimple";

import { AuthGuard } from "./adapters/http/AuthGuard";
import { createAuthRoutes as createAuthRoutesFactory } from "./adapters/http/AuthRoutes";

import type { ITokenBlacklistRepository } from "./ports/out/repository/ITokenBlacklistRepository";
import type { CredentialsTable } from "./adapters/db/models/CredentialsSchema";
import type { TokenBlacklistTable } from "./adapters/db/models/TokenBlacklistSchema";
import type { InviteTokensTable } from "./adapters/db/models/InviteTokenSchema";

export function createCredentialsRepository(
  db: Kysely<{ credentials: CredentialsTable }>,
) {
  return new CredentialsRepository(db);
}

export function createTokenBlacklistRepository(
  db: Kysely<{ token_blacklist: TokenBlacklistTable }>,
) {
  return new TokenBlacklistRepository(db);
}

export function createInviteTokenRepository(
  db: Kysely<{ invite_tokens: InviteTokensTable }>,
) {
  return new InviteTokenRepository(db);
}

export function createPasswordHasherService() {
  return new PasswordHasherService();
}

export function createKeyPairGeneratorService() {
  return new KeyPairGeneratorService();
}

export function createJwtTokenService(
  secret: string,
  tokenBlacklistRepo: ITokenBlacklistRepository,
) {
  return new JwtTokenServiceSimple(secret, tokenBlacklistRepo);
}

function createLoginUser(
  userRepository: IUserRepository,
  credentialsRepository: CredentialsRepository,
  jwtService: JwtTokenServiceSimple,
) {
  const passwordHasher = createPasswordHasherService();

  return new LoginUser(
    userRepository,
    credentialsRepository,
    passwordHasher,
    jwtService,
  );
}

function createLogoutUser(
  tokenBlacklistRepository: TokenBlacklistRepository,
  jwtService: JwtTokenServiceSimple,
) {
  return new LogoutUser(jwtService, tokenBlacklistRepository);
}

function createRegisterUser(
  userRepository: IUserRepository,
  credentialsRepository: CredentialsRepository,
  inviteTokenRepository: InviteTokenRepository,
  transactionManager: ITransactionManager,
  getServerSettings: IGetServerSettings,
) {
  const passwordHasher = createPasswordHasherService();
  const keyPairGen = createKeyPairGeneratorService();

  return new RegisterUser(
    userRepository,
    getServerSettings,
    inviteTokenRepository,
    passwordHasher,
    credentialsRepository,
    keyPairGen,
    transactionManager,
  );
}

export function createGenerateInviteToken(
  inviteTokenRepository: InviteTokenRepository,
  getServerSettings: IGetServerSettings,
) {
  return new GenerateInviteToken(inviteTokenRepository, getServerSettings);
}

export function createAuthGuard(jwtService: JwtTokenServiceSimple) {
  return new AuthGuard(jwtService);
}

export function createAuthRoutes(
  db: Kysely<{
    credentials: CredentialsTable;
    token_blacklist: TokenBlacklistTable;
    invite_tokens: InviteTokensTable;
  }>,
  userRepository: IUserRepository,
  getServerSettings: IGetServerSettings,
  transactionManager: ITransactionManager,
  jwtSecret: string,
) {
  const credentialsRepository = createCredentialsRepository(
    db as unknown as Kysely<{ credentials: CredentialsTable }>,
  );
  const tokenBlacklistRepository = createTokenBlacklistRepository(
    db as unknown as Kysely<{ token_blacklist: TokenBlacklistTable }>,
  );
  const inviteTokenRepository = createInviteTokenRepository(
    db as unknown as Kysely<{ invite_tokens: InviteTokensTable }>,
  );

  const jwtService = createJwtTokenService(jwtSecret, tokenBlacklistRepository);

  const loginUser = createLoginUser(
    userRepository,
    credentialsRepository,
    jwtService,
  );
  const logoutUser = createLogoutUser(tokenBlacklistRepository, jwtService);
  const registerUser = createRegisterUser(
    userRepository,
    credentialsRepository,
    inviteTokenRepository,
    transactionManager,
    getServerSettings,
  );

  return createAuthRoutesFactory(loginUser, logoutUser, registerUser);
}

