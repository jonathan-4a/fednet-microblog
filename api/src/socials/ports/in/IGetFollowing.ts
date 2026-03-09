// src/socials/ports/in/IGetFollowing.ts

export interface GetFollowingInput {
  username: string;
  host: string;
  protocol: string;
  page?: number;
}

export interface IGetFollowing {
  execute(input: GetFollowingInput): Promise<Record<string, unknown>>;
}
