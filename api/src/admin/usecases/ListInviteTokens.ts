// src/admin/usecases/ListInviteTokens.ts

import type { IListInviteTokens } from "../ports/in/IListInviteTokens";
import type { IInviteTokenRepository, InviteTokenRecord } from "@auth";

export class ListInviteTokens implements IListInviteTokens {
  constructor(private readonly inviteTokenRepository: IInviteTokenRepository) {}

  async execute(): Promise<InviteTokenRecord[]> {
    return this.inviteTokenRepository.listAllTokens();
  }
}
