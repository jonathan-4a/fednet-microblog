import { describe, it, expect } from "bun:test";
import { PasswordHasherService } from "../../../../../src/auth/adapters/security/PasswordHasherService";

describe("PasswordHasherService", () => {
  const hasher = new PasswordHasherService();

  it("should securely hash a password and verify it against the hash", async () => {
    const password = "super_secret_password";
    
    // Hash the password
    const hash = await hasher.hashPassword(password);
    
    expect(hash).toBeDefined();
    expect(hash).toContain(":"); // Format should be saltHex:hashHex
    
    // Verify valid password
    const result = await hasher.verifyPassword(password, hash);
    expect(result).toBe(true);

    // Verify invalid password
    const badResult = await hasher.verifyPassword("wrong_password", hash);
    expect(badResult).toBe(false);
  });

  it("should fail gracefully on malformed hashes", async () => {
    const password = "password";
    
    // No colon
    const result1 = await hasher.verifyPassword(password, "invalidhashformat");
    expect(result1).toBe(false);

    // Empty string
    const result2 = await hasher.verifyPassword(password, "");
    expect(result2).toBe(false);
  });

  it("should generate unique hashes for the same password due to random salts", async () => {
    const password = "password";
    
    const hash1 = await hasher.hashPassword(password);
    const hash2 = await hasher.hashPassword(password);
    
    expect(hash1).not.toBe(hash2);
    
    // Both should still verify correctly
    expect(await hasher.verifyPassword(password, hash1)).toBe(true);
    expect(await hasher.verifyPassword(password, hash2)).toBe(true);
  });
});

