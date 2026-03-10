// src/server.ts
import { app } from "./app";
import {
  initializeAdmin,
  ensureSchema,
  ensureServerSettings,
} from "./composition-root";
const PORT = parseInt(process.env.PORT!, 10);

async function initializeDatabase() {
  try {
    await ensureSchema();
    console.info("Database schema initialized");
    await ensureServerSettings();
    console.info("Server settings initialized");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
}

async function startServer() {
  try {
    await initializeDatabase();

    await initializeAdmin();

    Bun.serve({
      port: PORT,
      fetch: app.fetch,
    });

    console.log(`Server running on port ${PORT}`);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

void startServer();
