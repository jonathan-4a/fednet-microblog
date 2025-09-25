// src/auth/ports/out/services/IPasswordHasher.ts

export interface IPasswordHasher {
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hashed: string): Promise<boolean>;
}

