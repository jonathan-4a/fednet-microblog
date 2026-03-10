// src/admin/ports/in/IEnsureAdminUser.ts

import type { EnsureAdminUserInput } from "./Admin.dto";

export interface IEnsureAdminUser {
  execute(input: EnsureAdminUserInput): Promise<void>;
}
