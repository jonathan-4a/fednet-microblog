// src/admin/admin.di.ts
import type { Kysely } from "kysely";
import type {
  ITransactionManager,
  IGetServerSettings,
  IUpdateServerSettings,
} from "@shared";
import type {
  UsersTable,
  IUserRepository,
  IDeleteUserWithCascade,
} from "@users";
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
import {
  AdminBootstrap,
  type AdminBootstrapConfig,
} from "./adapters/AdminBootstrap";
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

export function createAdminUserRepository(
  db: Kysely<{ users: UsersTable }>,
): AdminUserRepository {
  return new AdminUserRepository(db);
}

export function createAdminPostRepository(
  db: Kysely<{ posts: PostsTable }>,
): AdminPostRepository {
  return new AdminPostRepository(db);
}

export function createGetAdminDashboard(
  adminUserRepository: AdminUserRepository,
  adminPostRepository: AdminPostRepository,
) {
  return new GetAdminDashboard(adminUserRepository, adminPostRepository);
}

export function createListAdminUsers(
  adminUserRepository: AdminUserRepository,
  adminPostRepository: AdminPostRepository,
) {
  return new ListAdminUsers(adminUserRepository, adminPostRepository);
}

export function createGetAdminUser(
  adminUserRepository: AdminUserRepository,
  adminPostRepository: AdminPostRepository,
) {
  return new GetAdminUser(adminUserRepository, adminPostRepository);
}

export function createEnableUser(adminUserRepository: AdminUserRepository) {
  return new EnableUser(adminUserRepository);
}

export function createDisableUser(adminUserRepository: AdminUserRepository) {
  return new DisableUser(adminUserRepository);
}

export function createDeleteUser(
  deleteUserWithCascade: IDeleteUserWithCascade,
) {
  return new DeleteUser(deleteUserWithCascade);
}

export function createListAdminPosts(adminPostRepository: AdminPostRepository) {
  return new ListAdminPosts(adminPostRepository);
}

export function createGetAdminPost(adminPostRepository: AdminPostRepository) {
  return new GetAdminPost(adminPostRepository);
}

export function createUpdateAdminPost(
  adminPostRepository: AdminPostRepository,
) {
  return new UpdateAdminPost(adminPostRepository);
}

export function createDeleteAdminPost(
  adminPostRepository: AdminPostRepository,
) {
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

export function createAdminRoutes(
  adminUserRepository: AdminUserRepository,
  adminPostRepository: AdminPostRepository,
  transactionManager: ITransactionManager,
  getServerSettings: IGetServerSettings,
  updateServerSettings: IUpdateServerSettings,
  inviteTokenRepository: IInviteTokenRepository,
  jwtTokenService: IJwtTokenService,
  deleteUserWithCascade: IDeleteUserWithCascade,
  domain: string,
  port: string,
) {
  const getAdminDashboard = createGetAdminDashboard(
    adminUserRepository,
    adminPostRepository,
  );
  const listAdminUsers = createListAdminUsers(
    adminUserRepository,
    adminPostRepository,
  );
  const getAdminUser = createGetAdminUser(
    adminUserRepository,
    adminPostRepository,
  );
  const enableUser = createEnableUser(adminUserRepository);
  const disableUser = createDisableUser(adminUserRepository);
  const deleteUser = createDeleteUser(deleteUserWithCascade);
  const listAdminPosts = createListAdminPosts(adminPostRepository);
  const getAdminPost = createGetAdminPost(adminPostRepository);
  const updateAdminPost = createUpdateAdminPost(adminPostRepository);
  const deleteAdminPost = createDeleteAdminPost(adminPostRepository);
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
    domain,
    port,
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

export function createAdminBootstrap(
  ensureAdminUser: EnsureAdminUser,
  config: AdminBootstrapConfig,
) {
  return new AdminBootstrap(ensureAdminUser, config);
}

export async function initializeAdmin(
  ensureAdminUser: EnsureAdminUser,
  config: AdminBootstrapConfig,
): Promise<void> {
  try {
    const adminBootstrap = createAdminBootstrap(ensureAdminUser, config);
    await adminBootstrap.run();
    console.log("Admin user initialized");
  } catch (error) {
    console.warn(
      "Admin initialization skipped:",
      error instanceof Error ? error.message : String(error),
    );
  }
}
