// src/auth/ports/in/Auth.dto.ts

import type { AuthenticatedUserOutput } from "@users";

export interface RegisterUserInput {
  username: string;
  password: string;
  displayName: string;
  summary: string;
  inviteToken?: string;
}

export interface RegisterUserOutput {
  success: boolean;
}

export interface LoginUserInput {
  username: string;
  password: string;
  domain: string;
  protocol: string;
}

export interface LoginUserOutput {
  token: string;
  user: AuthenticatedUserOutput;
}

export interface LogoutUserInput {
  token: string;
}

export interface GenerateInviteTokenInput {
  username: string;
}

export interface GenerateInviteTokenOutput {
  token: string;
  created_at: number;
}

