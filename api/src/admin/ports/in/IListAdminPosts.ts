// src/admin/ports/in/IListAdminPosts.ts

import type { PostsPaginationParams } from "../out/IAdminPostRepository";
import type { AdminPaginatedPosts } from "./Admin.dto";

export interface IListAdminPosts {
  execute(input: PostsPaginationParams): Promise<AdminPaginatedPosts>;
}
