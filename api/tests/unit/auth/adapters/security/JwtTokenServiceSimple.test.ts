import { describe, it, expect, mock } from "bun:test";
import { JwtTokenServiceSimple } from "@auth";
import type { AuthTokenPayload } from "@auth";

describe("JwtTokenServiceSimple", () => {
  const secret = "test-secret-key!@#";
  
  const mockPayload: AuthTokenPayload = {
    username: "testuser",
    address: "testuser@test.local",
    is_admin: true,
    is_active: true
  };

  it("should generate a token and successfully verify and decode it", async () => {
    const tokenBlacklistRepository = {
      isTokenBlacklisted: mock(() => Promise.resolve(false)),
      addToken: mock(() => Promise.resolve()),
      cleanupExpiredTokens: mock(() => Promise.resolve())
    };
    const jwtService = new JwtTokenServiceSimple(secret, tokenBlacklistRepository);

    const token = jwtService.generateAuthToken(mockPayload, "1h");
    expect(token).toBeDefined();
    expect(token.split(".")).toHaveLength(3); // Standard JWT format

    const verified = await jwtService.verifyAuthToken(token);
    expect(verified).toBeDefined();
    expect(verified?.username).toBe("testuser");
    expect(verified?.is_admin).toBe(true);
    
    const decoded = jwtService.decodeAuthToken(token);
    expect(decoded).toBeDefined();
    expect(decoded?.payload.username).toBe("testuser");
    expect(decoded?.exp).toBeGreaterThan(Date.now() / 1000); // Expiration is set in the future
  });

  it("should return null on verification if token is invalid or expired", async () => {
    const tokenBlacklistRepository = {
      isTokenBlacklisted: mock(() => Promise.resolve(false)),
      addToken: mock(() => Promise.resolve()),
      cleanupExpiredTokens: mock(() => Promise.resolve())
    };
    const jwtService = new JwtTokenServiceSimple(secret, tokenBlacklistRepository);

    const verified = await jwtService.verifyAuthToken("this.is.not.a.valid.jwt");
    expect(verified).toBeNull();
  });

  it("should return null on decoding if token is malformed", () => {
    const tokenBlacklistRepository = {
      isTokenBlacklisted: mock(() => Promise.resolve(false)),
      addToken: mock(() => Promise.resolve()),
      cleanupExpiredTokens: mock(() => Promise.resolve())
    };
    const jwtService = new JwtTokenServiceSimple(secret, tokenBlacklistRepository);

    const decoded = jwtService.decodeAuthToken("invalid-format");
    expect(decoded).toBeNull();
  });

  it("should return null on verification if token is blacklisted", async () => {
    const tokenBlacklistRepository = {
      isTokenBlacklisted: mock(() => Promise.resolve(true)),
      addToken: mock(() => Promise.resolve()),
      cleanupExpiredTokens: mock(() => Promise.resolve())
    };
    const jwtService = new JwtTokenServiceSimple(secret, tokenBlacklistRepository);

    const token = jwtService.generateAuthToken(mockPayload, "1h");
    const verified = await jwtService.verifyAuthToken(token);
    expect(verified).toBeNull();
    
    expect(tokenBlacklistRepository.isTokenBlacklisted).toHaveBeenCalledWith(token);
  });
});

