import { describe, it, expect } from "bun:test";
import { KeyPairGeneratorService } from "@auth";

describe("KeyPairGeneratorService", () => {
  const keyPairGenerator = new KeyPairGeneratorService();

  // This operation is computationally heavy, we give it a higher timeout if needed, but BUN should be fast.
  it("should successfully generate RSA RSA 4096-bit PEM keys", async () => {
    const { publicKey, privateKey } = await keyPairGenerator.generateKeyPair();
    
    expect(publicKey).toBeDefined();
    expect(privateKey).toBeDefined();

    expect(publicKey).toContain("-----BEGIN PUBLIC KEY-----");
    expect(publicKey).toContain("-----END PUBLIC KEY-----");
    
    expect(privateKey).toContain("-----BEGIN PRIVATE KEY-----");
    expect(privateKey).toContain("-----END PRIVATE KEY-----");
  });
});

