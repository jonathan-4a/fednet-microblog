// src/apcore/usecases/GetRemoteWebFinger.ts

import type { IGetRemoteWebFinger } from "../ports/in/IGetRemoteResource";
import type {
  GetRemoteWebFingerInput,
  WebFingerResponse,
} from "../ports/in/ActivityPub.dto";
import { InvalidResourceError } from "../domain/ActivityPubErrors";

export class GetRemoteWebFinger implements IGetRemoteWebFinger {
  private readonly logger = {
    log: (message: string) => console.log(`[GetRemoteWebFinger] ${message}`),
  };

  async execute(
    input: GetRemoteWebFingerInput,
  ): Promise<WebFingerResponse | null> {
    const { resource } = input;

    const match = resource.match(/^(?:acct:)?([^@]+)@([^:]+)(?::(\d+))?$/);
    if (!match) {
      throw new InvalidResourceError("Invalid resource format");
    }

    const [, username, domain, port] = match;
    const acctResource = port
      ? `acct:${username}@${domain}:${port}`
      : `acct:${username}@${domain}`;

    const protocols: Array<"https" | "http"> = ["https", "http"];

    for (const protocol of protocols) {
      const url = `${protocol}://${domain}${port ? `:${port}` : ""}/.well-known/webfinger?resource=${encodeURIComponent(acctResource)}`;

      try {
        this.logger.log(`[GetRemoteWebFinger] Trying ${url}`);

        const response = await fetch(url, {
          headers: {
            Accept: "application/jrd+json, application/json",
            "User-Agent": "ActivityPub-Server/1.0",
          },
        });

        if (!response.ok) continue;

        const data = await response.json();
        return data as WebFingerResponse;
      } catch {
        continue;
      }
    }

    return null;
  }
}

