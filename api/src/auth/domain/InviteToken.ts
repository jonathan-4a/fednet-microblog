// src/auth/domain/InviteToken.ts

export interface InviteToken {
  token: string;
  createdBy: string | null;
  status: "unused" | "used" | "revoked";
  createdAt: number;
  usedAt: number | null;
  usedBy: string | null;
}
