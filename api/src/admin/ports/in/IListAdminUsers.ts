// src/admin/ports/in/IListAdminUsers.ts

import type { UserListFilters } from "../out/IAdminUserRepository";
import type { AdminPaginatedUsers } from "../in/Admin.dto";
export interface IListAdminUsers {
  execute(input: {
    domain: string;
    filters: UserListFilters;
  }): Promise<AdminPaginatedUsers>;
}

