// src/apcore/ports/in/IFanOutActivity.ts

export interface FanOutActivityInput {
  actorUrl: string;
  activity: Record<string, unknown>;
}

export interface IFanOutActivity {
  execute(input: FanOutActivityInput): Promise<void>;
}

