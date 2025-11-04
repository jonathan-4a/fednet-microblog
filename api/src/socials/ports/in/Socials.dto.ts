// src/socials/ports/in/Socials.dto.ts

export interface GetFollowersInput {
  username: string;
  host: string;
  protocol: string;
}

export interface GetFollowingInput {
  username: string;
  host: string;
  protocol: string;
}

export interface MarkFollowAcceptedInput {
  followerActor: string;
  followedActor: string;
  host: string;
  protocol: string;
}

export interface AcceptIncomingFollowInput {
  follower: string;
  followActivity: Record<string, unknown>;
}

export interface RecordLocalFollowRequestInput {
  username: string;
  targetActor: string;
  host: string;
  protocol: string;
}

export interface RemoveLocalFollowingInput {
  username: string;
  targetActor: string;
  host: string;
  protocol: string;
}

