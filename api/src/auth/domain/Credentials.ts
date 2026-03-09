// src/auth/domain/Credentials.ts

export interface Credentials {
  username: string;
  passwordHash: string;
  publicKeyPem: string;
  privkey: string;
}
