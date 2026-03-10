// src/auth/adapters/security/PasswordHasherService.ts

import { promisify } from "util";
import crypto from "crypto";
import type { IPasswordHasher } from "../../ports/out/services/IPasswordHasher";

const scrypt = promisify(crypto.scrypt);

export class PasswordHasherService implements IPasswordHasher {
  private readonly SALT_LENGTH = 32;
  private readonly KEY_LENGTH = 64;

  async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(this.SALT_LENGTH);
    const hash = (await scrypt(password, salt, this.KEY_LENGTH)) as Buffer;
    return `${salt.toString("hex")}:${hash.toString("hex")}`;
  }

  async verifyPassword(password: string, hashed: string): Promise<boolean> {
    const [saltHex, hashHex] = hashed.split(":");
    if (!saltHex || !hashHex) {
      return false;
    }

    const salt = Buffer.from(saltHex, "hex");
    const hash = (await scrypt(password, salt, this.KEY_LENGTH)) as Buffer;
    return hash.toString("hex") === hashHex;
  }
}
