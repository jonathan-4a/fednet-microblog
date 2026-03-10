// src/admin/ports/in/IListInviteTokens.ts

import type { InviteTokenRecord } from "@auth";

export interface IListInviteTokens {
  execute(): Promise<InviteTokenRecord[]>;
}
