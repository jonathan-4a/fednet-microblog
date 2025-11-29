// src/apcore/ports/in/IGetOutbox.ts

import type { GetOutboxInput } from "./ActivityPub.dto";
export type { GetOutboxInput } from "./ActivityPub.dto";

export interface IGetOutbox {
  execute(input: GetOutboxInput): Promise<Record<string, unknown>>;
}

