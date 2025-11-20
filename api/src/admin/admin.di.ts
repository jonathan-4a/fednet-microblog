// src/admin/admin.di.ts

import type { Kysely } from "kysely";
import type {
  ITransactionManager,
  IGetServerSettings,
  IUpdateServerSettings,
} from "@shared";
import { createDeleteUserWithCascade } from "@users";
import type { UsersTable, IUserRepository } from "@users";
import type { PostsTable } from "@posts";
import type { IInviteTokenRepository } from "@auth";
import type {
  ICredentialsRepository,
  IPasswordHasher,
  IKeyPairGenerator,
} from "@auth";
import type { IJwtTokenService } from "@auth";
import { AdminUserRepository } from "./adapters/db/AdminUserRepository";
import { AdminPostRepository } from "./adapters/db/AdminPostRepository";
import { AdminGuard } from "./adapters/http/AdminGuard";
import { createAdminRoutes as createAdminRoutesFactory } from "./adapters/http/AdminRoutes";
import { AdminBootstrap } from "./adapters/AdminBootstrap";
import { GetAdminDashboard } from "./usecases/GetAdminDashboard";
import { ListAdminUsers } from "./usecases/ListAdminUsers";
import { GetAdminUser } from "./usecases/GetAdminUser";
import { EnableUser } from "./usecases/EnableUser";
import { DisableUser } from "./usecases/DisableUser";
import { DeleteUser } from "./usecases/DeleteUser";
import { ListAdminPosts } from "./usecases/ListAdminPosts";
import { GetAdminPost } from "./usecases/GetAdminPost";
import { UpdateAdminPost } from "./usecases/UpdateAdminPost";
import { DeleteAdminPost } from "./usecases/DeleteAdminPost";
import { GetServerSettings } from "./usecases/GetServerSettings";
import { UpdateSettings } from "./usecases/UpdateSettings";
import { ListInviteTokens } from "./usecases/ListInviteTokens";
import { RevokeInviteToken } from "./usecases/RevokeInviteToken";
import { EnsureAdminUser } from "./usecases/EnsureAdminUser";

// Factories - accept external dependencies as parameters

function getAdminUserRepository<T>(db: Kysely<T>) {
  return new AdminUserRepository(
    db as unknown as Kysely<{ users: UsersTable }>,
  );
}
function getAdminPostRepository<T>(db: Kysely<T>) {
  return new AdminPostRepository(
    db as unknown as Kysely<{ posts: PostsTable }>,
  );
}

export function createGetAdminDashboard<T>(db: Kysely<T>) {
  const adminUserRepository = getAdminUserRepository(db);
  const adminPostRepository = getAdminPostRepository(db);
  return new GetAdminDashboard(adminUserRepository, adminPostRepository);
}

export function createListAdminUsers<T>(db: Kysely<T>) {
  const adminUserRepository = getAdminUserRepository(db);
  const adminPostRepository = getAdminPostRepository(db);
  return new ListAdminUsers(adminUserRepository, adminPostRepository);
}

export function createGetAdminUser<T>(db: Kysely<T>) {
  const adminUserRepository = getAdminUserRepository(db);
  const adminPostRepository = getAdminPostRepository(db);
  return new GetAdminUser(adminUserRepository, adminPostRepository);
}

export function createEnableUser<T>(db: Kysely<T>) {
  const adminUserRepository = getAdminUserRepository(db);
  return new EnableUser(adminUserRepository);
}

export function createDisableUser<T>(db: Kysely<T>) {
  const adminUserRepository = getAdminUserRepository(db);
  return new DisableUser(adminUserRepository);
}

export function createDeleteUser<T>(
  db: Kysely<T>,
  transactionManager: ITransactionManager,
) {
  const deleteUserWithCascade = createDeleteUserWithCascade(
    db as Parameters<typeof createDeleteUserWithCascade>[0],
    transactionManager,
  );
  return new DeleteUser(deleteUserWithCascade);
}

export function createListAdminPosts<T>(db: Kysely<T>) {
  const adminPostRepository = getAdminPostRepository(db);
  return new ListAdminPosts(adminPostRepository);
}

export function createGetAdminPost<T>(db: Kysely<T>) {
  const adminPostRepository = getAdminPostRepository(db);
  return new GetAdminPost(adminPostRepository);
}

export function createUpdateAdminPost<T>(db: Kysely<T>) {
  const adminPostRepository = getAdminPostRepository(db);
  return new UpdateAdminPost(adminPostRepository);
}

export function createDeleteAdminPost<T>(db: Kysely<T>) {
  const adminPostRepository = getAdminPostRepository(db);
  return new DeleteAdminPost(adminPostRepository);
}

export function createGetServerSettings(getServerSettings: IGetServerSettings) {
  return new GetServerSettings(getServerSettings);
}

export function createUpdateSettings(
  updateServerSettings: IUpdateServerSettings,
) {
  return new UpdateSettings(updateServerSettings);
}

export function createListInviteTokens(
  inviteTokenRepository: IInviteTokenRepository,
) {
  return new ListInviteTokens(inviteTokenRepository);
}

export function createRevokeInviteToken(
  inviteTokenRepository: IInviteTokenRepository,
) {
  return new RevokeInviteToken(inviteTokenRepository);
}

export function createAdminGuard(jwtTokenService: IJwtTokenService) {
  return new AdminGuard(jwtTokenService);
}

export function createAdminRoutes<T>(
  db: Kysely<T>,
  transactionManager: ITransactionManager,
  getServerSettings: IGetServerSettings,
  updateServerSettings: IUpdateServerSettings,
  inviteTokenRepository: IInviteTokenRepository,
  jwtTokenService: IJwtTokenService,
) {
  const getAdminDashboard = createGetAdminDashboard(db);
  const listAdminUsers = createListAdminUsers(db);
  const getAdminUser = createGetAdminUser(db);
  const enableUser = createEnableUser(db);
  const disableUser = createDisableUser(db);
  const deleteUser = createDeleteUser(db, transactionManager);
  const listAdminPosts = createListAdminPosts(db);
  const getAdminPost = createGetAdminPost(db);
  const updateAdminPost = createUpdateAdminPost(db);
  const deleteAdminPost = createDeleteAdminPost(db);
  const getSettings = createGetServerSettings(getServerSettings);
  const updateSettings = createUpdateSettings(updateServerSettings);
  const listInviteTokens = createListInviteTokens(inviteTokenRepository);
  const revokeInviteToken = createRevokeInviteToken(inviteTokenRepository);
  const adminGuard = createAdminGuard(jwtTokenService);

  return createAdminRoutesFactory(
    getAdminDashboard,
    listAdminUsers,
    getAdminUser,
    enableUser,
    disableUser,
    deleteUser,
    listAdminPosts,
    getAdminPost,
    updateAdminPost,
    deleteAdminPost,
    getSettings,
    updateSettings,
    listInviteTokens,
    revokeInviteToken,
    adminGuard,
  );
}

export function createEnsureAdminUser(
  userRepository: IUserRepository,
  credentialsRepository: ICredentialsRepository,
  passwordHasher: IPasswordHasher,
  keyPairGenerator: IKeyPairGenerator,
  transactionManager: ITransactionManager,
) {
  return new EnsureAdminUser(
    userRepository,
    credentialsRepository,
    passwordHasher,
    keyPairGenerator,
    transactionManager,
  );
}

export function createAdminBootstrap(ensureAdminUser: EnsureAdminUser) {
  return new AdminBootstrap(ensureAdminUser);
}

export async function initializeAdmin(
  ensureAdminUser: EnsureAdminUser,
): Promise<void> {
  try {
    const adminBootstrap = createAdminBootstrap(ensureAdminUser);
    await adminBootstrap.run();
    console.log("Admin user initialized");
  } catch (error) {
    console.warn(
      "Admin initialization skipped:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

