import { describe, it, expect, mock, beforeEach } from "bun:test";
import { LogoutUser } from "../../../../src/auth/usecases/LogoutUser";
import { AuthenticationError } from "../../../../src/auth/domain/AuthErrors";

describe("LogoutUser Use Case", () => {
  let jwtTokenService: any;
  let tokenBlacklistRepository: any;
  let logoutUser: LogoutUser;

  beforeEach(() => {
    jwtTokenService = {
      decodeAuthToken: mock(() => ({ exp: 1234567890 })),
    };
    tokenBlacklistRepository = {
      isTokenBlacklisted: mock(() => Promise.resolve(false)),
      addToken: mock(() => Promise.resolve()),
    };

    logoutUser = new LogoutUser(jwtTokenService, tokenBlacklistRepository);
  });

  it("should successfully logout and blacklist a valid token", async () => {
    await logoutUser.execute({ token: "valid-token" });

    expect(jwtTokenService.decodeAuthToken).toHaveBeenCalledWith("valid-token");
    expect(tokenBlacklistRepository.isTokenBlacklisted).toHaveBeenCalledWith("valid-token");
    expect(tokenBlacklistRepository.addToken).toHaveBeenCalledWith("valid-token", 1234567890);
  });

  it("should throw AuthenticationError if token cannot be decoded", async () => {
    jwtTokenService.decodeAuthToken.mockReturnValue(null);

    await expect(logoutUser.execute({ token: "invalid-token" })).rejects.toThrow(AuthenticationError);
  });

  it("should throw AuthenticationError if token is already blacklisted", async () => {
    tokenBlacklistRepository.isTokenBlacklisted.mockResolvedValue(true);

    await expect(logoutUser.execute({ token: "valid-token" })).rejects.toThrow(AuthenticationError);
  });
});

