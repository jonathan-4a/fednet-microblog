// src/apcore/adapters/http/SignatureGuard.ts

import crypto from "crypto";
import { AuthenticationError } from "../../domain/ActivityPubErrors";

export class SignatureGuard {
  async verify(req: Request): Promise<boolean> {
    const signatureHeader = req.headers.get("signature");
    const hostHeader = req.headers.get("host");
    const dateHeader = req.headers.get("date");
    const digestHeader = req.headers.get("digest");

    if (!signatureHeader || !hostHeader || !dateHeader || !digestHeader) {
      throw new AuthenticationError("Invalid or missing HTTP signature");
    }

    const now = Date.now();
    const dateMs = Date.parse(dateHeader);
    if (!Number.isFinite(dateMs) || Math.abs(now - dateMs) > 5 * 60 * 1000) {
      throw new AuthenticationError("Invalid or expired date header");
    }

    try {
      const [, providedDigest] = String(digestHeader).split("SHA-256=");
      const body = await req.clone().text();
      const computedDigest = crypto
        .createHash("sha256")
        .update(body)
        .digest("base64");
      if (!providedDigest || providedDigest !== computedDigest) {
        throw new AuthenticationError("Digest mismatch");
      }
    } catch (e) {
      if (e instanceof AuthenticationError) throw e;
      throw new AuthenticationError("Invalid or missing HTTP signature");
    }

    const params: Record<string, string> = {};
    for (const part of String(signatureHeader).split(",")) {
      const [k, v] = part.split("=");
      if (!k || !v) continue;
      params[k.trim()] = v.trim().replace(/^"|"$/g, "");
    }

    const keyId = params.keyId;
    const headers = params.headers;
    const signature = params.signature;
    if (!keyId || !headers || !signature) {
      throw new AuthenticationError("Invalid signature header format");
    }

    const headersList = headers.split(/\s+/);
    const url = new URL(req.url);
    const pathWithQuery = url.pathname + (url.search || "");

    const headerValues: Record<string, string> = {
      "(request-target)": `post ${pathWithQuery}`,
      host: hostHeader,
      date: dateHeader,
      digest: digestHeader,
    };

    let signingString = "";
    for (let i = 0; i < headersList.length; i++) {
      const name = headersList[i];
      const value = headerValues[name];
      if (!value) {
        throw new AuthenticationError(`Missing header value for ${name}`);
      }
      signingString += `${name}: ${value}`;
      if (i !== headersList.length - 1) signingString += "\n";
    }

    const actorUrl = keyId.split("#")[0];

    try {
      const response = await fetch(actorUrl, {
        headers: { Accept: "application/activity+json" },
        method: "GET",
      });

      if (!response.ok) {
        throw new AuthenticationError("Failed to fetch actor");
      }

      const actor = (await response.json()) as {
        publicKey?: { publicKeyPem?: string };
      };
      const publicKeyPem = actor?.publicKey?.publicKeyPem;
      if (!publicKeyPem) {
        throw new AuthenticationError("No public key found for actor");
      }

      const verifier = crypto.createVerify("RSA-SHA256");
      verifier.update(signingString);
      const ok = verifier.verify(publicKeyPem, signature, "base64");

      if (!ok) {
        throw new AuthenticationError("Signature verification failed");
      }

      return true;
    } catch (e) {
      if (e instanceof AuthenticationError) throw e;
      throw new AuthenticationError("Invalid or missing HTTP signature");
    }
  }
}

