// src/app.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";

import {
  createAppRoutes,
  createAuthRoutes,
  createAdminRoutes,
  createUsersRoutes,
  createPostsRoutes,
  createSocialsRoutes,
  createActivityPubRoutes,
  createNotificationsRoutes,
} from "./composition-root";
import { globalExceptionHandler } from "./globalExceptionHandler";

export const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    exposeHeaders: ["Link"],
  }),
);
app.onError(globalExceptionHandler);

app.use("/assets/*", serveStatic({ root: "./public" }));

app.route("/api", createAppRoutes());
app.route("/api/auth", createAuthRoutes());
app.route("/api/admin", createAdminRoutes());
app.route("/api/users", createUsersRoutes());
app.route("/api/notifications", createNotificationsRoutes());
app.route("/", createActivityPubRoutes());
app.route("/", createPostsRoutes());
app.route("/", createSocialsRoutes());

app.get("*", serveStatic({ path: "./public/index.html" }));
