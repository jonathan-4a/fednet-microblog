// src/auth/ports/in/ILogoutUser.ts

import type { LogoutUserInput } from "./Auth.dto";
export type { LogoutUserInput } from "./Auth.dto";

export interface ILogoutUser {
  execute(input: LogoutUserInput): Promise<void>;
}

