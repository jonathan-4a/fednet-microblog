// src/auth/adapters/security/SignPayload.ts

import crypto from "crypto";

export function signPayload(
  payload: string | Buffer,
  privateKey: string,
  outputEncoding: crypto.BinaryToTextEncoding = "base64",
): string {
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(payload);
  signer.end();
  return signer.sign(privateKey, outputEncoding);
}

