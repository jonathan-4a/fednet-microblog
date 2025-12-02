// src/apcore/usecases/GetRemoteResource.ts

import type {
  IGetRemoteResource,
  GetRemoteResourceRawResult,
} from "../ports/in/IGetRemoteResource";
import type { GetRemoteResourceInput } from "../ports/in/ActivityPub.dto";
import { InvalidResourceError, FetchError } from "../domain/ActivityPubErrors";
import { HttpSignatureService } from "../adapters/http/HttpSignatureService";

export class GetRemoteResource implements IGetRemoteResource {
  private readonly logger = {
    log: (message: string) => console.log(`[GetRemoteResource] ${message}`),
    debug: (message: string) => console.debug(`[GetRemoteResource] ${message}`),
    warn: (message: string) => console.warn(`[GetRemoteResource] ${message}`),
    error: (message: string, ...args: unknown[]) =>
      console.error(`[GetRemoteResource] ${message}`, ...args),
  };

  constructor(private readonly httpSignatureService: HttpSignatureService) {}

  async execute(
    input: GetRemoteResourceInput,
  ): Promise<Record<string, unknown> | GetRemoteResourceRawResult> {
    const {
      url,
      acceptHeader = "application/activity+json",
      signAsUsername,
      raw = false,
    } = input;

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new InvalidResourceError("Invalid URL format");
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new InvalidResourceError("Only HTTP and HTTPS URLs are allowed");
    }

    try {
      this.logger.log(
        `[GetRemoteResource] Fetching ${url}${signAsUsername ? ` (signed as ${signAsUsername})` : ""}`,
      );

      const headers: Record<string, string> = {
        Accept: acceptHeader,
        "User-Agent": "ActivityPub-Server/1.0",
      };

      // REST API endpoints (like /api/v1/) don't accept HTTP signatures
      // Only sign ActivityPub protocol endpoints
      const isRestApiEndpoint = parsedUrl.pathname.startsWith("/api/v1/");

      // Add HTTP signature if username is provided and it's not a REST API endpoint
      if (signAsUsername && !isRestApiEndpoint) {
        const signedHeaders = await this.httpSignatureService.signRequest({
          method: "GET",
          url,
          targetDomain: parsedUrl.host,
          username: signAsUsername,
        });
        Object.assign(headers, signedHeaders);
        this.logger.debug(
          `[GetRemoteResource] Signature details: keyId=${signedHeaders.Signature.match(/keyId="([^"]+)"/)?.[1]}, headers sent: ${JSON.stringify(Object.keys(headers))}`,
        );
      } else if (signAsUsername && isRestApiEndpoint) {
        this.logger.debug(
          `[GetRemoteResource] Skipping HTTP signature for REST API endpoint: ${url}`,
        );
      } else {
        this.logger.warn(
          `[GetRemoteResource] No username provided, request will be unsigned`,
        );
      }

      let response: Response;
      try {
        response = await fetch(url, { headers });
      } catch (fetchError) {
        const errorMessage =
          fetchError instanceof Error ? fetchError.message : String(fetchError);
        const errorName =
          fetchError instanceof Error ? fetchError.name : "UnknownError";
        this.logger.error(
          `[GetRemoteResource] Network error fetching ${url}: ${errorName} - ${errorMessage}`,
          fetchError instanceof Error ? fetchError.stack : undefined,
        );
        throw new FetchError(`Network error: ${errorName} - ${errorMessage}`);
      }

      if (raw) {
        const body = await response.arrayBuffer();
        const contentType =
          response.headers.get("content-type") ?? "application/octet-stream";
        return {
          status: response.status,
          statusText: response.statusText,
          contentType,
          body,
        };
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        const responseHeaders = Object.fromEntries(response.headers.entries());
        const isCollectionPage =
          parsedUrl.pathname.includes("/followers") ||
          parsedUrl.pathname.includes("/following");

        if (response.status === 403 && isCollectionPage) {
          this.logger.debug(
            `[GetRemoteResource] Access denied to ${url} (likely privacy setting)`,
          );
        } else {
          this.logger.error(
            `[GetRemoteResource] Failed to fetch ${url}: ${response.status} ${response.statusText}`,
            JSON.stringify(
              {
                status: response.status,
                statusText: response.statusText,
                url,
                signedAs: signAsUsername || "unsigned",
                errorBody: errorText.substring(0, 500),
                contentType: responseHeaders["content-type"],
              },
              null,
              2,
            ),
          );
        }
        throw new FetchError(
          `Failed to fetch resource: ${response.status} ${response.statusText}${errorText ? ` - ${errorText.substring(0, 200)}` : ""}`,
        );
      }

      // Check Content-Type before parsing JSON
      const contentType = response.headers.get("content-type") || "";
      if (
        !contentType.includes("application/json") &&
        !contentType.includes("application/activity+json")
      ) {
        const text = await response.text().catch(() => "");
        this.logger.error(
          `[GetRemoteResource] Invalid content type for ${url}: ${contentType}. Response preview: ${text.substring(0, 200)}`,
        );
        throw new FetchError(
          `Invalid content type: ${contentType}. Expected JSON but got ${contentType}`,
        );
      }

      let data: Record<string, unknown>;
      try {
        data = await response.json();
      } catch (jsonError) {
        const responseText = await response.text().catch(() => "");
        this.logger.error(
          `[GetRemoteResource] Failed to parse JSON from ${url}`,
          JSON.stringify(
            {
              contentType: response.headers.get("content-type"),
              status: response.status,
              responsePreview: responseText.substring(0, 500),
              error:
                jsonError instanceof Error
                  ? jsonError.message
                  : String(jsonError),
            },
            null,
            2,
          ),
        );
        throw new FetchError(
          `Invalid JSON response from ${url}: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`,
        );
      }

      return data;
    } catch (error) {
      if (
        error instanceof FetchError ||
        error instanceof InvalidResourceError
      ) {
        throw error;
      }
      const errorDetails = {
        url,
        errorName: error instanceof Error ? error.name : "UnknownError",
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };
      this.logger.error(
        `[GetRemoteResource] Unexpected error fetching ${url}`,
        JSON.stringify(errorDetails, null, 2),
      );
      throw new FetchError(
        `Failed to fetch remote resource: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

