// src/users/adapters/http/UsersRoutes.ts

import type { Context, Next } from "hono";
import { Hono } from "hono";
import { UsersUrls } from "./UsersUrls";
import { UserController } from "./UserController";
import type { AuthTokenPayload, IGenerateInviteToken } from "@auth";
import type { IGetUserProfile } from "@users/ports/in/IGetUserProfile";
import type { IUpdateUserProfile } from "@users/ports/in/IUpdateUserProfile";
import type { IDeleteUserAccount } from "@users/ports/in/IDeleteUserAccount";
import type { ISearchUsers } from "@users/ports/in/ISearchUsers";

type Variables = {
  user: AuthTokenPayload;
};

export type AuthMiddleware = (
  c: Context,
  next: Next,
) => Promise<Response | void>;

export function createUsersRoutes(
  getUserProfile: IGetUserProfile,
  updateUserProfile: IUpdateUserProfile,
  deleteUserAccount: IDeleteUserAccount,
  searchUsers: ISearchUsers,
  authMiddleware: AuthMiddleware,
  generateInviteToken: IGenerateInviteToken,
) {
  const app = new Hono<{ Variables: Variables }>();

  app.use("*", authMiddleware);

  const controller = new UserController(
    getUserProfile,
    updateUserProfile,
    deleteUserAccount,
    searchUsers,
    generateInviteToken,
  );

  app.get(UsersUrls.me, (c) => controller.getOwnProfile(c));
  app.patch(UsersUrls.me, (c) => controller.updateProfile(c));
  app.delete(UsersUrls.me, (c) => controller.deleteAccount(c));
  app.get(UsersUrls.search, (c) => controller.search(c));
  app.post(UsersUrls.invites, (c) => controller.generateInvite(c));

  return app;
}
