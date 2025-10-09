// src/users/ports/in/ISearchUsers.ts

import { SearchUsersOutput, SearchUsersInput } from "./Users.dto";

export interface ISearchUsers {
  execute(input: SearchUsersInput): Promise<SearchUsersOutput>;
}

