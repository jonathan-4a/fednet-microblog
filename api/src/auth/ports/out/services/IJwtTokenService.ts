// src/auth/ports/out/services/IJwtTokenService.ts

export interface AuthTokenPayload {
  username: string;
  address: string;
  is_admin: boolean;
  is_active: boolean;
}

export interface DecodedToken {
  payload: AuthTokenPayload;
  exp: number;
}

export interface IJwtTokenService {
  generateAuthToken(
    payload: AuthTokenPayload,
    expiresIn?: string | number,
  ): string;
  verifyAuthToken(token: string): Promise<AuthTokenPayload | null>;
  decodeAuthToken(token: string): DecodedToken | null;
}
