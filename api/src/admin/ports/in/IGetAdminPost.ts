// src/admin/ports/in/IGetAdminPost.ts

import type { AdminPostSummary } from "./Admin.dto";
export interface IGetAdminPost {
  execute(input: { guid: string }): Promise<AdminPostSummary>;
}
