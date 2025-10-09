// src/users/ports/in/IDeleteUserAccount.ts

import { DeleteUserAccountInput } from "../../ports/in/Users.dto";

export interface IDeleteUserAccount {
  execute(input: DeleteUserAccountInput): Promise<void>;
}

