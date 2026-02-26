import { describe, it, expect, mock, beforeEach } from "bun:test";
import { GenerateInviteToken } from "../../../../src/auth/usecases/GenerateInviteToken";
import { AuthBusinessRuleError } from "../../../../src/auth/domain/AuthErrors";

describe("GenerateInviteToken Use Case", () => {
  let inviteTokenRepository: any;
  let getServerSettings: any;
  let generateInviteToken: GenerateInviteToken;

  beforeEach(() => {
    inviteTokenRepository = {
      createToken: mock(() => Promise.resolve({
        token: "new-invite-token",
        created_at: 1000000
      })),
    };
    getServerSettings = {
      execute: mock(() => Promise.resolve({ registration_mode: "invite" })),
    };

    generateInviteToken = new GenerateInviteToken(inviteTokenRepository, getServerSettings);
  });

  it("should generate an invite token when in invite mode", async () => {
    const result = await generateInviteToken.execute({ username: "adminuser" });

    expect(result.token).toBe("new-invite-token");
    expect(result.created_at).toBe(1000000);
    expect(getServerSettings.execute).toHaveBeenCalled();
    expect(inviteTokenRepository.createToken).toHaveBeenCalledWith("adminuser");
  });

  it("should throw AuthBusinessRuleError if server is not in invite mode", async () => {
    getServerSettings.execute.mockResolvedValue({ registration_mode: "open" });

    await expect(generateInviteToken.execute({ username: "adminuser" })).rejects.toThrow(AuthBusinessRuleError);

    expect(inviteTokenRepository.createToken).not.toHaveBeenCalled();
  });
});

