// src/apcore/ports/in/IDispatchS2SActivityEvent.ts

import type { DispatchS2SActivityEventInput } from "./ActivityPub.dto";

export interface IDispatchS2SActivityEvent {
  execute(input: DispatchS2SActivityEventInput): void;
}

