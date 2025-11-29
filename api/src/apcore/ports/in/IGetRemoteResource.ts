// src/apcore/ports/in/IGetRemoteResource.ts

import type {
  GetRemoteResourceInput,
  GetRemoteWebFingerInput,
  WebFingerResponse,
} from "./ActivityPub.dto";
export type {
  GetRemoteResourceInput,
  GetRemoteWebFingerInput,
} from "./ActivityPub.dto";

export interface GetRemoteResourceRawResult {
  status: number;
  statusText: string;
  contentType: string;
  body: ArrayBuffer;
}

export interface IGetRemoteResource {
  execute(
    input: GetRemoteResourceInput,
  ): Promise<Record<string, unknown> | GetRemoteResourceRawResult>;
}

export interface IGetRemoteWebFinger {
  execute(input: GetRemoteWebFingerInput): Promise<WebFingerResponse | null>;
}

