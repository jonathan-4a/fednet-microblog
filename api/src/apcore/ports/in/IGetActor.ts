// src/apcore/ports/in/IGetActor.ts

import type { ActorDocument } from "../out/IActorSerializer";
import type { GetActorInput } from "./ActivityPub.dto";
export type { GetActorInput } from "./ActivityPub.dto";

export interface IGetActor {
  execute(input: GetActorInput): Promise<ActorDocument>;
}
