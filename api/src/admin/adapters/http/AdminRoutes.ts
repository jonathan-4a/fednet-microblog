// src/admin/adapters/http/AdminRoutes.ts

import { Hono } from "hono";
import { AdminURLs } from "./AdminURLs";
import { AdminController } from "./AdminController";
import { AdminGuard } from "./AdminGuard";

import type {
  IGetAdminDashboard,
  IListAdminUsers,
  IGetAdminUser,
  IEnableUser,
  IDisableUser,
  IDeleteUser,
  IListAdminPosts,
  IGetAdminPost,
  IUpdateAdminPost,
  IDeleteAdminPost,
  IGetServerSettings,
  IUpdateSettings,
  IListInviteTokens,
  IRevokeInviteToken,
} from "@admin/ports/in";

export function createAdminRoutes(
  getAdminDashboard: IGetAdminDashboard,
  listAdminUsers: IListAdminUsers,
  getAdminUser: IGetAdminUser,
  enableUser: IEnableUser,
  disableUser: IDisableUser,
  deleteUser: IDeleteUser,
  listAdminPosts: IListAdminPosts,
  getAdminPost: IGetAdminPost,
  updateAdminPost: IUpdateAdminPost,
  deleteAdminPost: IDeleteAdminPost,
  getServerSettings: IGetServerSettings,
  updateSettings: IUpdateSettings,
  listInviteTokens: IListInviteTokens,
  revokeInviteToken: IRevokeInviteToken,
  adminGuard: AdminGuard,
  domain: string,
  port: string,
) {
  const app = new Hono();
  const controller = new AdminController(
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
    getServerSettings,
    updateSettings,
    listInviteTokens,
    revokeInviteToken,
    domain,
    port,
  );

  // Apply admin guard to all routes
  app.use("*", (c, next) => adminGuard.authenticate(c, next));

  // Dashboard
  app.get(AdminURLs.dashboard, (c) => controller.dashboard(c));

  // Users
  app.get(AdminURLs.users, (c) => controller.listUsers(c));
  app.get(AdminURLs.user, (c) => controller.getUser(c));
  app.patch(AdminURLs.user, (c) => controller.updateUser(c));
  app.delete(AdminURLs.user, (c) => controller.removeUser(c));

  // Posts
  app.get(AdminURLs.posts, (c) => controller.listPosts(c));
  app.get(AdminURLs.post, (c) => controller.getPost(c));
  app.patch(AdminURLs.post, (c) => controller.updatePost(c));
  app.delete(AdminURLs.post, (c) => controller.deletePost(c));

  // Settings
  app.get(AdminURLs.settings, () => controller.getSettings());
  app.patch(AdminURLs.settings, (c) => controller.updateSettings(c));

  // Invites
  app.get(AdminURLs.invites, (c) => controller.listInvites(c));
  app.delete(AdminURLs.invite, (c) => controller.revokeInvite(c));

  return app;
}
