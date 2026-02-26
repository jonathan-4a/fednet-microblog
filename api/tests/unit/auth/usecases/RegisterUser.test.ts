import { describe, it, expect, mock, beforeEach } from "bun:test";
import { RegisterUser } from "../../../../src/auth/usecases/RegisterUser";
import {
  AuthValidationError,
  AuthConflictError,
  AuthBusinessRuleError,
} from "../../../../src/auth/domain/AuthErrors";

describe("RegisterUser Use Case", () => {
  let userRepository: any;
  let getServerSettings: any;
  let inviteTokenRepository: any;
  let passwordHasher: any;
  let credentialsRepository: any;
  let transactionManager: any;
  let keyPairGenerator: any;
  let registerUser: RegisterUser;

  beforeEach(() => {
    userRepository = {
      findUserByUsername: mock(() => Promise.resolve(undefined)),
      createUser: mock(() => Promise.resolve()),
    };
    getServerSettings = {
      execute: mock(() => Promise.resolve({ registration_mode: "open" })),
    };
    inviteTokenRepository = {
      findToken: mock(() => Promise.resolve(undefined)),
      markTokenUsed: mock(() => Promise.resolve(true)),
    };
    passwordHasher = {
      hashPassword: mock(() => Promise.resolve("hashed-password")),
    };
    credentialsRepository = {
      createCredentials: mock(() => Promise.resolve()),
    };
    transactionManager = {
      execute: mock((fn: any) => fn({})),
    };
    keyPairGenerator = {
      generateKeyPair: mock(() =>
        Promise.resolve({ publicKey: "pub", privateKey: "priv" }),
      ),
    };

    registerUser = new RegisterUser(
      userRepository,
      getServerSettings,
      inviteTokenRepository,
      passwordHasher,
      credentialsRepository,
      keyPairGenerator,
      transactionManager,
    );
  });

  it("should successfully register a user in open mode", async () => {
    const result = await registerUser.execute({
      username: "newuser",
      password: "securepassword",
      displayName: "New User",
      summary: "Hello world"
    });

    expect(result.success).toBe(true);
    expect(userRepository.findUserByUsername).toHaveBeenCalledWith("newuser");
    expect(keyPairGenerator.generateKeyPair).toHaveBeenCalled();
    expect(passwordHasher.hashPassword).toHaveBeenCalledWith("securepassword");
    expect(transactionManager.execute).toHaveBeenCalled();
  });

  it("should throw AuthValidationError if password is too short", async () => {
    await expect(registerUser.execute({
      username: "newuser",
      password: "short",
      displayName: "New User",
      summary: "Hello world"
    })).rejects.toThrow(AuthValidationError);
  });

  it("should throw AuthConflictError if username already exists", async () => {
    userRepository.findUserByUsername.mockResolvedValue({ username: "existinguser" });

    await expect(registerUser.execute({
      username: "existinguser",
      password: "securepassword",
      displayName: "Existing User",
      summary: "Hello world"
    })).rejects.toThrow(AuthConflictError);
  });

  it("should validate and consume invite token in invite mode", async () => {
    getServerSettings.execute.mockResolvedValue({ registration_mode: "invite" });
    inviteTokenRepository.findToken.mockResolvedValue({
      token: "valid-invite",
      status: "unused"
    });

    const result = await registerUser.execute({
      username: "inviteduser",
      password: "securepassword",
      displayName: "Invited User",
      summary: "Hello",
      inviteToken: "valid-invite"
    });

    expect(result.success).toBe(true);
    expect(inviteTokenRepository.findToken).toHaveBeenCalledWith(
      "valid-invite",
    );
    expect(inviteTokenRepository.markTokenUsed).toHaveBeenCalledWith(
      { token: "valid-invite", usedBy: "inviteduser" },
      expect.anything(),
    );
  });

  it("should throw AuthBusinessRuleError if invite token is missing in invite mode", async () => {
    getServerSettings.execute.mockResolvedValue({ registration_mode: "invite" });

    await expect(registerUser.execute({
      username: "newuser",
      password: "securepassword",
      displayName: "User",
      summary: "Hi"
    })).rejects.toThrow(AuthBusinessRuleError);
  });

  it("should throw AuthValidationError if invite token is invalid or used", async () => {
    getServerSettings.execute.mockResolvedValue({ registration_mode: "invite" });
    inviteTokenRepository.findToken.mockResolvedValue(undefined); // token not found

    await expect(registerUser.execute({
      username: "newuser",
      password: "securepassword",
      displayName: "User",
      summary: "Hi",
      inviteToken: "invalid-token"
    })).rejects.toThrow(AuthValidationError);

    inviteTokenRepository.findToken.mockResolvedValue({ status: "used" }); // token used
    await expect(registerUser.execute({
      username: "newuser",
      password: "securepassword",
      displayName: "User",
      summary: "Hi",
      inviteToken: "used-token"
    })).rejects.toThrow(AuthValidationError);
  });
});

