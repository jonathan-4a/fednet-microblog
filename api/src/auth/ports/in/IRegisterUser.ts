// src/auth/ports/in/IRegisterUser.ts

import type { RegisterUserInput, RegisterUserOutput } from "./Auth.dto";

export interface IRegisterUser {
  execute(input: RegisterUserInput): Promise<RegisterUserOutput>;
}
