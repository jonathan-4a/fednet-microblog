// src/admin/ports/in/IDeleteAdminPost.ts

export interface IDeleteAdminPost {
  execute(input: { guid: string }): Promise<void>;
}
