// src/notifications/ports/in/IMarkNotificationRead.ts

import type { MarkNotificationReadInput } from "./Notifications.dto";

export interface IMarkNotificationRead {
  execute(input: MarkNotificationReadInput): Promise<boolean>;
}
