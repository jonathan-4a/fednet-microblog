// src/apcore/adapters/serializers/WebFinger.ts

import type {
  IWebFingerSerializer,
  WebFingerDocument,
} from "../../ports/out/IWebFingerSerializer";

export class WebFinger implements IWebFingerSerializer {
  create(
    username: string,
    domain: string,
    protocol = "https",
    port?: string,
  ): WebFingerDocument {
    const host = port ? `${domain}:${port}` : domain;
    return {
      subject: `acct:${username}@${domain}`,
      links: [
        {
          rel: "self",
          type: "application/activity+json",
          href: `${protocol}://${host}/u/${username}`,
        },
      ],
    };
  }
}

