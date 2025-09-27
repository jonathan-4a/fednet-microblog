// src/auth/adapters/security/VerifySignature.ts

import crypto from "crypto";

export function verifySignature(
  payload: string | Buffer,
  signature: string,
  publicKey: string,
  inputEncoding: crypto.BinaryToTextEncoding = "base64",
): boolean {
  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(payload);
  verifier.end();
  return verifier.verify(publicKey, signature, inputEncoding);
}

