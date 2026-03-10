// src/apcore/ports/in/IGetRemoteResource.ts

import type { GetRemoteResourceInput } from "./ActivityPub.dto";
export type { GetRemoteResourceInput } from "./ActivityPub.dto";

export interface GetRemoteResourceRawResult {
  status: number;
  statusText: string;
  contentType: string;
  body: ArrayBuffer;
  link?: string;
}

export interface IGetRemoteResource {
  execute(
    input: GetRemoteResourceInput,
  ): Promise<Record<string, unknown> | GetRemoteResourceRawResult>;
}
