import crypto from "crypto";
import { AuthenticationError } from "../../domain/ActivityPubErrors";

const CLOCK_SKEW_MS = 5 * 60 * 1000;
const ACTOR_FETCH_TIMEOUT_MS = 5000;
const ACTOR_FETCH_MAX_BYTES = 64 * 1024;

function parseSignatureHeader(header: string): Record<string, string> {
  const params: Record<string, string> = {};
  const re = /(\w+)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(header)) !== null) {
    params[match[1]] = match[2];
  }
  return params;
}

export class SignatureGuard {
  async verify(req: Request): Promise<boolean> {
    const signatureHeader = req.headers.get("signature");
    const hostHeader = req.headers.get("host");
    const dateHeader = req.headers.get("date");
    const digestHeader = req.headers.get("digest");

    if (!signatureHeader || !hostHeader || !dateHeader || !digestHeader) {
      throw new AuthenticationError("Invalid or missing HTTP signature");
    }

    const dateMs = Date.parse(dateHeader);
    if (
      !Number.isFinite(dateMs) ||
      Math.abs(Date.now() - dateMs) > CLOCK_SKEW_MS
    ) {
      throw new AuthenticationError("Invalid or expired date header");
    }

    const providedDigest = String(digestHeader).split("SHA-256=")[1];
    if (!providedDigest) {
      throw new AuthenticationError("Unsupported or missing digest algorithm");
    }

    const body = await req.clone().text();
    const computedDigest = crypto
      .createHash("sha256")
      .update(body)
      .digest("base64");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(providedDigest),
        Buffer.from(computedDigest),
      )
    ) {
      throw new AuthenticationError("Digest mismatch");
    }

    const params = parseSignatureHeader(String(signatureHeader));
    const { keyId, headers, signature } = params;

    if (!keyId || !headers || !signature) {
      throw new AuthenticationError("Invalid signature header format");
    }

    const url = new URL(req.url);
    const pathWithQuery = url.pathname + (url.search || "");

    const knownHeaders: Record<string, string> = {
      "(request-target)": `${req.method.toLowerCase()} ${pathWithQuery}`,
      host: hostHeader,
      date: dateHeader,
      digest: digestHeader,
    };

    const signingString = headers
      .split(/\s+/)
      .map((name) => {
        const value = knownHeaders[name] ?? req.headers.get(name) ?? undefined;
        if (value === undefined) {
          throw new AuthenticationError(`Missing header value for: ${name}`);
        }
        return `${name}: ${value}`;
      })
      .join("\n");

    const publicKeyPem = await this.fetchPublicKey(keyId.split("#")[0]);

    try {
      const verifier = crypto.createVerify("RSA-SHA256");
      verifier.update(signingString);
      if (!verifier.verify(publicKeyPem, signature, "base64")) {
        throw new AuthenticationError("Signature verification failed");
      }
    } catch (e) {
      if (e instanceof AuthenticationError) throw e;
      throw new AuthenticationError(
        `Signature verification error: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    return true;
  }

  private async fetchPublicKey(actorUrl: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      ACTOR_FETCH_TIMEOUT_MS,
    );

    try {
      const response = await fetch(actorUrl, {
        headers: { Accept: "application/activity+json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new AuthenticationError(
          `Failed to fetch actor (HTTP ${response.status})`,
        );
      }

      const raw = await response.arrayBuffer();
      if (raw.byteLength > ACTOR_FETCH_MAX_BYTES) {
        throw new AuthenticationError("Actor response exceeds size limit");
      }

      const actor = JSON.parse(new TextDecoder().decode(raw)) as {
        publicKey?: { publicKeyPem?: string };
      };

      const pem = actor?.publicKey?.publicKeyPem;
      if (!pem) {
        throw new AuthenticationError("No public key found for actor");
      }

      return pem;
    } catch (e) {
      if (e instanceof AuthenticationError) throw e;
      throw new AuthenticationError(
        `Could not retrieve actor public key: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
