import { describe, it, expect, mock, beforeEach } from "bun:test";
import { LoginUser } from "../../../../src/auth/usecases/LoginUser";
import { AuthenticationError } from "../../../../src/auth/domain/AuthErrors";

describe("LoginUser Use Case", () => {
  let userRepository: any;
  let credentialsRepository: any;
  let passwordHasher: any;
  let jwtTokenService: any;
  let loginUser: LoginUser;

  const domain = "test.local";

  beforeEach(() => {
    userRepository = {
      findUserByUsername: mock(() => Promise.resolve(undefined)),
    };
    credentialsRepository = {
      findCredentialsByUsername: mock(() => Promise.resolve(undefined)),
    };
    passwordHasher = {
      verifyPassword: mock(() => Promise.resolve(false)),
    };
    jwtTokenService = {
      generateAuthToken: mock(() => "mock-jwt-token"),
    };

    loginUser = new LoginUser(
      userRepository,
      credentialsRepository,
      passwordHasher,
      jwtTokenService,
      domain,
    );
  });

  const mockUser = {
    username: "testuser",
    displayName: "Test User",
    summary: "Test Summary",
    isActive: true,
    isAdmin: false,
    isFollowingPublic: true,
    createdAt: Date.now(),
  };

  const mockCreds = {
    username: "testuser",
    passwordHash: "hashed-pwd",
    publicKeyPem: "pub-key",
    privateKey: "priv-key",
  };

  it("should successfully log in a valid user and return a token", async () => {
    userRepository.findUserByUsername.mockResolvedValue(mockUser);
    credentialsRepository.findCredentialsByUsername.mockResolvedValue(
      mockCreds,
    );
    passwordHasher.verifyPassword.mockResolvedValue(true);

    const result = await loginUser.execute({
      username: "testuser",
      password: "password123",
    });

    expect(result.token).toBe("mock-jwt-token");
    expect(result.user.username).toBe("testuser");
    expect(result.user.isActive).toBe(true);

    expect(userRepository.findUserByUsername).toHaveBeenCalledWith("testuser");
    expect(
      credentialsRepository.findCredentialsByUsername,
    ).toHaveBeenCalledWith("testuser");
    expect(passwordHasher.verifyPassword).toHaveBeenCalledWith(
      "password123",
      "hashed-pwd",
    );
    expect(jwtTokenService.generateAuthToken).toHaveBeenCalledWith({
      username: "testuser",
      address: `testuser@${domain}`,
      is_admin: false,
      is_active: true,
    });
  });

  it("should throw AuthenticationError if user does not exist", async () => {
    userRepository.findUserByUsername.mockResolvedValue(undefined);

    await expect(
      loginUser.execute({
        username: "unknownuser",
        password: "password123",
      }),
    ).rejects.toThrow(AuthenticationError);
  });

  it("should throw AuthenticationError if user is not active", async () => {
    userRepository.findUserByUsername.mockResolvedValue({
      ...mockUser,
      isActive: false,
    });

    await expect(
      loginUser.execute({
        username: "testuser",
        password: "password123",
      }),
    ).rejects.toThrow(AuthenticationError);
  });

  it("should throw AuthenticationError if credentials are not found", async () => {
    userRepository.findUserByUsername.mockResolvedValue(mockUser);
    credentialsRepository.findCredentialsByUsername.mockResolvedValue(
      undefined,
    );

    await expect(
      loginUser.execute({
        username: "testuser",
        password: "password123",
      }),
    ).rejects.toThrow(AuthenticationError);
  });

  it("should throw AuthenticationError if password verification fails", async () => {
    userRepository.findUserByUsername.mockResolvedValue(mockUser);
    credentialsRepository.findCredentialsByUsername.mockResolvedValue(
      mockCreds,
    );
    passwordHasher.verifyPassword.mockResolvedValue(false);

    await expect(
      loginUser.execute({
        username: "testuser",
        password: "wrongpassword",
      }),
    ).rejects.toThrow(AuthenticationError);
  });
});

