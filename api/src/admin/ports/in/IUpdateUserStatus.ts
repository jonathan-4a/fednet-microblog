// src/admin/ports/in/IUpdateUserStatus.ts

export interface IUpdateUserStatus {
  execute(input: { username: string }): Promise<{ is_active: boolean }>;
}

