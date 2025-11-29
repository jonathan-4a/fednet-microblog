// src/apcore/ports/in/IDispatchC2SActivityEvent.ts

import type { DispatchC2SActivityEventInput } from "./ActivityPub.dto";

export interface IDispatchC2SActivityEvent {
  execute(input: DispatchC2SActivityEventInput): void;
}

