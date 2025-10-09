// src/users/ports/in/IGetUserProfile.ts

import { AuthenticatedUserOutput } from "./Users.dto";

export interface GetUserProfileInput {
  username: string;
}

export interface IGetUserProfile {
  execute(input: GetUserProfileInput): Promise<AuthenticatedUserOutput>;
}

