// src/apcore/ports/in/IGetWebFinger.ts

import type { GetWebFingerInput, WebFingerResponse } from "./ActivityPub.dto";
export type { GetWebFingerInput, WebFingerResponse } from "./ActivityPub.dto";

export interface IGetWebFinger {
  execute(input: GetWebFingerInput): Promise<WebFingerResponse>;
}
