// src/users/ports/in/IUpdateUserProfile.ts

import { UserProfileOutput, UpdateUserProfileInput } from "./Users.dto";

export interface IUpdateUserProfile {
  execute(input: UpdateUserProfileInput): Promise<UserProfileOutput>;
}

