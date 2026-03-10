// src/admin/usecases/GetServerSettings.ts

import type {
  AdminServerSettings,
  IGetServerSettings,
} from "../ports/in/IGetServerSettings";
import type { IGetServerSettings as ISharedGetServerSettings } from "@shared";

export class GetServerSettings implements IGetServerSettings {
  constructor(private readonly getServerSettings: ISharedGetServerSettings) {}

  async execute(): Promise<AdminServerSettings> {
    return this.getServerSettings.execute({});
  }
}
