// src/notifications/ports/in/IMarkAllNotificationsRead.ts

import type { MarkAllNotificationsReadInput } from "./Notifications.dto";

export interface IMarkAllNotificationsRead {
  execute(input: MarkAllNotificationsReadInput): Promise<number>;
}
