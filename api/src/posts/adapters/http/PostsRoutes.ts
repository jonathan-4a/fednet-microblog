// src/posts/adapters/http/PostsRoutes.ts

import type { Context, Next } from "hono";
import { Hono } from "hono";
import { PostsUrls } from "./PostsUrls";
import { PostsController } from "./PostsController";

import type { AuthTokenPayload } from "@auth";
import type { IGetPost } from "@posts/ports/in/IGetPost";
import type { IGetPostReplies } from "@posts/ports/in/IGetPostReplies";
import type { IGetPostLikes } from "@posts/ports/in/IGetPostLikes";
import type { IGetPostShares } from "@posts/ports/in/IGetPostShares";
import type { IUpdatePost } from "@posts/ports/in/IUpdatePost";
import type { IDeletePost } from "@posts/ports/in/IDeletePost";

type Variables = {
  user: AuthTokenPayload;
};

type AuthMiddleware = (c: Context, next: Next) => Promise<Response | void>;

export function createPostsRoutes(
  getPost: IGetPost,
  getPostReplies: IGetPostReplies,
  getPostLikes: IGetPostLikes,
  getPostShares: IGetPostShares,
  updatePost: IUpdatePost,
  deletePost: IDeletePost,
  host: string,
  protocol: string,
  authMiddleware?: AuthMiddleware,
) {
  const app = new Hono<{ Variables: Variables }>();

  const controller = new PostsController(
    getPost,
    getPostReplies,
    getPostLikes,
    getPostShares,
    updatePost,
    deletePost,
    host,
    protocol,
  );

  app.get(PostsUrls.userStatus, (c) => controller.getPost(c));
  app.get(PostsUrls.userStatusReplies, (c) => controller.getReplies(c));
  app.get(PostsUrls.userStatusLikes, (c) => controller.getLikes(c));
  app.get(PostsUrls.userStatusShares, (c) => controller.getShares(c));

  if (authMiddleware) {
    app.patch(PostsUrls.updatePost, authMiddleware, (c) =>
      controller.updatePost(c),
    );
    app.delete(PostsUrls.deletePost, authMiddleware, (c) =>
      controller.deletePost(c),
    );
  } else {
    app.patch(PostsUrls.updatePost, (c) => controller.updatePost(c));
    app.delete(PostsUrls.deletePost, (c) => controller.deletePost(c));
  }

  return app;
}
