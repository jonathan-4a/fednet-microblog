// src/socials/adapters/http/SocialsRoutes.ts

import { Hono } from "hono";
import { SocialsUrls } from "./SocialsUrls";
import { SocialsController } from "./SocialsController";

import type { IGetFollowers } from "../../ports/in/IGetFollowers";
import type { IGetFollowing } from "../../ports/in/IGetFollowing";
import type { IGetLiked } from "@posts";

export function createSocialsRoutes(
  getFollowers: IGetFollowers,
  getFollowing: IGetFollowing,
  getLiked: IGetLiked,
  host: string,
  protocol: string,
) {
  const app = new Hono();

  const controller = new SocialsController(
    getFollowers,
    getFollowing,
    getLiked,
    host,
    protocol,
  );

  app.get(SocialsUrls.userFollowers, (c) => controller.followers(c));

  app.get(SocialsUrls.userFollowing, (c) => controller.following(c));

  app.get(SocialsUrls.userLiked, (c) => controller.liked(c));

  return app;
}
