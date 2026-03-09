import type { IDeleteUserAccount } from "../ports/in/IDeleteUserAccount";
import type { DeleteUserAccountInput } from "../ports/in/Users.dto";
import type { IDeleteUserWithCascade } from "./DeleteUserWithCascade";

export class DeleteUserAccount implements IDeleteUserAccount {
  constructor(private readonly deleteUserWithCascade: IDeleteUserWithCascade) {}

  async execute(input: DeleteUserAccountInput): Promise<void> {
    await this.deleteUserWithCascade.execute({ username: input.username });
  }
}
