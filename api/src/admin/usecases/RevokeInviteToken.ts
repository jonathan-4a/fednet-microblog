// src/admin/usecases/RevokeInviteToken.ts

import type { IRevokeInviteToken } from "../ports/in/IRevokeInviteToken";
import type {
  RevokeInviteTokenInput,
  RevokeInviteTokenOutput,
} from "../ports/in/Admin.dto";
import type { IInviteTokenRepository } from "@auth";

export class RevokeInviteToken implements IRevokeInviteToken {
  constructor(private readonly inviteTokenRepository: IInviteTokenRepository) {}

  async execute(
    input: RevokeInviteTokenInput,
  ): Promise<RevokeInviteTokenOutput> {
    const token = await this.inviteTokenRepository.findToken(input.token);

    if (!token) {
      return {
        success: false,
        message: "Invite token not found",
      };
    }

    if (token.status === "used") {
      return {
        success: false,
        message: "Cannot revoke an already used token",
      };
    }

    if (token.status === "revoked") {
      return {
        success: false,
        message: "Token is already revoked",
      };
    }

    const revoked = await this.inviteTokenRepository.revokeToken(input.token);

    if (!revoked) {
      return {
        success: false,
        message: "Failed to revoke token",
      };
    }

    return {
      success: true,
      message: "Invite token revoked successfully",
    };
  }
}
