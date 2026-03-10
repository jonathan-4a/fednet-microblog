// src/auth/ports/out/services/IKeyPairGenerator.ts

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface IKeyPairGenerator {
  generateKeyPair(): Promise<KeyPair>;
}
