// src/auth/adapters/security/KeyPairGeneratorService.ts

import crypto from "crypto";
import type {
  IKeyPairGenerator,
  KeyPair,
} from "../../ports/out/services/IKeyPairGenerator";

export class KeyPairGeneratorService implements IKeyPairGenerator {
  async generateKeyPair(): Promise<KeyPair> {
    return new Promise<KeyPair>((resolve, reject) => {
      crypto.generateKeyPair(
        "rsa",
        {
          modulusLength: 512,
          publicKeyEncoding: { type: "spki", format: "pem" },
          privateKeyEncoding: { type: "pkcs8", format: "pem" },
        },
        (err, publicKey, privateKey) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({ publicKey, privateKey } as KeyPair);
        },
      );
    });
  }
}
