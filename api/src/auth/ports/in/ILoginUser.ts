// src/auth/ports/in/ILoginUser.ts

import { LoginUserInput, LoginUserOutput } from "./Auth.dto";
export interface ILoginUser {
  execute(input: LoginUserInput): Promise<LoginUserOutput>;
}
