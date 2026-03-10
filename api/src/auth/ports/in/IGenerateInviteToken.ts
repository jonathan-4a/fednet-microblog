// src/auth/ports/in/IGenerateInviteToken.ts

import {
  GenerateInviteTokenInput,
  GenerateInviteTokenOutput,
} from "../../ports/in/Auth.dto";

export interface IGenerateInviteToken {
  execute(input: GenerateInviteTokenInput): Promise<GenerateInviteTokenOutput>;
}
