// src/apcore/adapters/http/HttpSignatureService.ts
import type { ICredentialsRepository } from "@auth";
import { NotFoundError } from "../../domain/ActivityPubErrors";
import crypto from "crypto";

export interface SignRequestOptions {
  method: "GET" | "POST";
  url: string;
  targetDomain: string;
  username: string;
  body?: string;
}

export interface SignedHeaders {
  Host: string;
  Date: string;
  Signature: string;
  Digest?: string;
}

export class HttpSignatureService {
  constructor(
    private readonly credentialsRepository: ICredentialsRepository,
    private readonly ourOrigin: string,
  ) {}

  async signRequest(options: SignRequestOptions): Promise<SignedHeaders> {
    const { method, url, targetDomain, username, body } = options;

    const credentials =
      await this.credentialsRepository.findCredentialsByUsername(username);
    if (!credentials) {
      throw new NotFoundError(`User ${username} not found`);
    }

    const privateKey = credentials.privkey;
    const date = new Date().toUTCString();
    const urlObj = new URL(url);
    const path = urlObj.pathname + urlObj.search;

    let signatureString: string;
    let headersList: string;
    const signedHeaders: SignedHeaders = {
      Host: targetDomain,
      Date: date,
      Signature: "",
    };

    if (method === "POST" && body) {
      const messageDigest = crypto
        .createHash("sha256")
        .update(body)
        .digest("base64");
      signedHeaders.Digest = `SHA-256=${messageDigest}`;
      signatureString = `(request-target): post ${path}\nhost: ${targetDomain}\ndate: ${date}\ndigest: SHA-256=${messageDigest}`;
      headersList = "(request-target) host date digest";
    } else {
      signatureString = `(request-target): get ${path}\nhost: ${targetDomain}\ndate: ${date}`;
      headersList = "(request-target) host date";
    }

    const signature = crypto
      .createSign("RSA-SHA256")
      .update(signatureString)
      .sign(privateKey, "base64");

    const actorUrl = `${this.ourOrigin}/u/${username}`;

    signedHeaders.Signature = `keyId="${actorUrl}#main-key",headers="${headersList}",signature="${signature}"`;

    console.log(
      `[HttpSignatureService] Created ${method} signature for ${username} to ${targetDomain}${path}`,
    );

    return signedHeaders;
  }
}
