// src/admin/admin.module.ts

// Export use case classes
export { GetAdminDashboard } from "./usecases/GetAdminDashboard";
export { ListAdminUsers } from "./usecases/ListAdminUsers";
export { GetAdminUser } from "./usecases/GetAdminUser";
export { EnableUser } from "./usecases/EnableUser";
export { DisableUser } from "./usecases/DisableUser";
export { DeleteUser } from "./usecases/DeleteUser";
export { ListAdminPosts } from "./usecases/ListAdminPosts";
export { GetAdminPost } from "./usecases/GetAdminPost";
export { UpdateAdminPost } from "./usecases/UpdateAdminPost";
export { DeleteAdminPost } from "./usecases/DeleteAdminPost";
export { GetServerSettings } from "./usecases/GetServerSettings";
export { UpdateSettings } from "./usecases/UpdateSettings";
export { ListInviteTokens } from "./usecases/ListInviteTokens";
export { RevokeInviteToken } from "./usecases/RevokeInviteToken";
export { EnsureAdminUser } from "./usecases/EnsureAdminUser";

// Export repositories
export { AdminUserRepository } from "./adapters/db/AdminUserRepository";
export { AdminPostRepository } from "./adapters/db/AdminPostRepository";

// Export adapters
export { AdminGuard } from "./adapters/http/AdminGuard";
export { AdminBootstrap } from "./adapters/AdminBootstrap";

// Export factory functions from di.ts
export {
  createGetAdminDashboard,
  createListAdminUsers,
  createGetAdminUser,
  createEnableUser,
  createDisableUser,
  createDeleteUser,
  createListAdminPosts,
  createGetAdminPost,
  createUpdateAdminPost,
  createDeleteAdminPost,
  createGetServerSettings,
  createUpdateSettings,
  createListInviteTokens,
  createRevokeInviteToken,
  createAdminGuard,
  createAdminRoutes,
  createEnsureAdminUser,
  createAdminBootstrap,
  initializeAdmin,
} from "./admin.di";

