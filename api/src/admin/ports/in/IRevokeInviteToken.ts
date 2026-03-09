// src/admin/ports/in/IRevokeInviteToken.ts

import type {
  RevokeInviteTokenInput,
  RevokeInviteTokenOutput,
} from "./Admin.dto";

export interface IRevokeInviteToken {
  execute(input: RevokeInviteTokenInput): Promise<RevokeInviteTokenOutput>;
}
