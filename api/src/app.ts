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
} from "./composition-root";
import { globalExceptionHandler } from "./globalExceptionHandler";

export const app = new Hono();

app.use("*", logger());
app.use("*", cors());
app.onError(globalExceptionHandler);

// Serve built frontend assets (JS/CSS, etc.)
app.use("/assets/*", serveStatic({ root: "./public" }));

app.route("/api", createAppRoutes());
app.route("/api/auth", createAuthRoutes());
app.route("/api/admin", createAdminRoutes());
app.route("/api/users", createUsersRoutes());
app.route("/", createActivityPubRoutes());
app.route("/", createPostsRoutes());
app.route("/", createSocialsRoutes());

// SPA fallback: any unmatched route returns index.html (no 404 for client routes)
app.get("*", serveStatic({ path: "./public/index.html" }));

