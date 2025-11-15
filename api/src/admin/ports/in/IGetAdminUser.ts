// src/admin/ports/in/IGetAdminUser.ts

import type { AdminUserDetails } from "./Admin.dto";

export interface IGetAdminUser {
  execute(input: {
    username: string;
    domain: string;
  }): Promise<AdminUserDetails>;
}

