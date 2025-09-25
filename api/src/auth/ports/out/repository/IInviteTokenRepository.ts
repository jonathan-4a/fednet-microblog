// src/auth/ports/out/repository/IInviteTokenRepository.ts

export interface InviteTokenRecord {
  token: string;
  created_by: string | null;
  status: "unused" | "used" | "revoked";
  created_at: number;
  used_at: number | null;
  used_by: string | null;
}

export type Transaction = unknown;

export interface IInviteTokenRepository {
  findToken(
    token: string,
    trx?: Transaction,
  ): Promise<InviteTokenRecord | undefined>;
  markTokenUsed(
    params: { token: string; usedBy: string },
    trx?: Transaction,
  ): Promise<boolean>;
  createToken(createdBy: string, trx?: Transaction): Promise<InviteTokenRecord>;
  listTokensByCreator(createdBy: string): Promise<InviteTokenRecord[]>;
  listAllTokens(): Promise<InviteTokenRecord[]>;
  revokeToken(token: string, trx?: Transaction): Promise<boolean>;
}

