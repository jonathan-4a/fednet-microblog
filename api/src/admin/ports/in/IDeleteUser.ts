// src/admin/ports/in/IDeleteUser.ts

export interface IDeleteUser {
  execute(input: { username: string }): Promise<void>;
}

