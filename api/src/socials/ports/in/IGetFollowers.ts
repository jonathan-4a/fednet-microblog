// src/socials/ports/in/IGetFollowers.ts

export interface GetFollowersInput {
  username: string;
  host: string;
  protocol: string;
  page?: number;
}

export interface IGetFollowers {
  execute(input: GetFollowersInput): Promise<Record<string, unknown>>;
}
