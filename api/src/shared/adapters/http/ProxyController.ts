// src/shared/adapters/http/ProxyController.ts

import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { IGetRemoteResource, GetRemoteResourceRawResult } from "@apcore";

export class ProxyController {
  constructor(private readonly getRemoteResource?: IGetRemoteResource) {}

  async proxy(c: Context) {
    const url = c.req.query("url");
    const address = c.req.query("address");

    if (!url) {
      throw new HTTPException(400, {
        message: "Missing 'url' query parameter",
      });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new HTTPException(400, {
        message: "Invalid 'url' format",
      });
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new HTTPException(400, {
        message: "Only HTTP and HTTPS protocols are allowed",
      });
    }

    const method = c.req.method.toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
      throw new HTTPException(405, {
        message: "Only GET and HEAD methods are supported by this proxy",
      });
    }

    const acceptHeader =
      c.req.header("Accept") ??
      "application/activity+json, application/json;q=0.9, */*;q=0.8";

    let username: string | undefined;
    try {
      const user = c.get("user") as { username?: string } | undefined;
      username = user?.username;
    } catch {
      username = undefined;
    }

    if (
      this.getRemoteResource &&
      typeof username === "string" &&
      username.length > 0
    ) {
      try {
        const result = await this.getRemoteResource.execute({
          url,
          acceptHeader,
          signAsUsername: username,
          raw: true,
        });
        const raw = result as GetRemoteResourceRawResult;
        const headers: Record<string, string> = {
          "content-type": raw.contentType,
        };
        if (raw.link) headers["Link"] = raw.link;
        return new Response(raw.body, {
          status: raw.status,
          statusText: raw.statusText,
          headers,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown network error";
        throw new HTTPException(502, {
          message: `Failed to fetch remote resource: ${message}`,
        });
      }
    }

    const headers: Record<string, string> = {
      Accept: acceptHeader,
      "User-Agent": "Minerva-Proxy/1.0",
    };

    if (address) {
      headers["X-Requested-Address"] = address;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown network error";

      throw new HTTPException(502, {
        message: `Failed to fetch remote resource: ${message}`,
      });
    }

    const body = await response.arrayBuffer();
    const contentType =
      response.headers.get("content-type") ?? "application/octet-stream";
    const responseHeaders: Record<string, string> = {
      "content-type": contentType,
    };
    const link = response.headers.get("Link");
    if (link) responseHeaders["Link"] = link;
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  }
}
