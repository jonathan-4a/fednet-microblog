// src/shared/adapters/http/AppController.ts
import * as path from "path";
import { readFile } from "fs/promises";
import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import type { IGetServerSettings } from "@shared/ports/in/IGetServerSettings";

// defined error handling types are not used here, unlike usecases
export class AppController {
  constructor(private readonly getServerSettings: IGetServerSettings) {}

  getHealth(c: Context) {
    return c.json({ status: "ok" });
  }

  async getConfig(c: Context) {
    const settings = await this.getServerSettings.execute({});

    return c.json({
      registration_mode: settings.registration_mode,
    });
  }

  async getApiDocs(c: Context) {
    try {
      const html = await readFile(
        path.join(process.cwd(), "public", "apiDocs.html"),
        "utf-8",
      );

      return c.html(html);
    } catch {
      throw new HTTPException(404, {
        message: "API Docs not found",
      });
    }
  }

  async getOpenApiSpec(c: Context) {
    const specPath = path.join(process.cwd(), "openapi.json");
    const raw = await readFile(specPath, "utf8");
    const spec = JSON.parse(raw) as Record<string, unknown>;

    const protocol = process.env.PROTOCOL;
    const domain = process.env.DOMAIN;
    const port = process.env.PORT;

    if (!protocol || !domain || !port) {
      throw new HTTPException(500, {
        message: "PROTOCOL, DOMAIN, and PORT must be defined in env",
      });
    }

    const host = `${protocol}://${domain}:${port}`;

    spec.servers = [
      {
        url: host,
        description: `Instance running on ${domain}:${port}`,
      },
    ];

    return c.json(spec);
  }
}

