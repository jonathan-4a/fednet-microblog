// src/auth/usecases/GenerateInviteToken.ts

import type { IGenerateInviteToken } from "../ports/in/IGenerateInviteToken";
import type {
  GenerateInviteTokenInput,
  GenerateInviteTokenOutput,
} from "../ports/in/Auth.dto";
import type { IInviteTokenRepository } from "../ports/out/repository/IInviteTokenRepository";
import type { IGetServerSettings } from "@shared";

import { AuthBusinessRuleError } from "../domain/AuthErrors";

export class GenerateInviteToken implements IGenerateInviteToken {
  constructor(
    private readonly inviteTokenRepository: IInviteTokenRepository,
    private readonly getServerSettings: IGetServerSettings,
  ) {}

  async execute(
    input: GenerateInviteTokenInput,
  ): Promise<GenerateInviteTokenOutput> {
    const settings = await this.getServerSettings.execute({});

    if (settings.registration_mode !== "invite") {
      throw new AuthBusinessRuleError(
        "Invite generation is disabled because the server is not in 'invite' registration mode.",
      );
    }

    const tokenRecord = await this.inviteTokenRepository.createToken(
      input.username,
    );

    return {
      token: tokenRecord.token,
      created_at: tokenRecord.created_at,
    };
  }
}
