// src/admin/ports/in/IUpdateAdminPost.ts

import type { UpdateAdminPostInput } from "./Admin.dto";

export interface IUpdateAdminPost {
  execute(input: UpdateAdminPostInput): Promise<{ updated: boolean }>;
}
