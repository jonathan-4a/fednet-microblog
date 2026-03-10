// src/admin/ports/in/IGetAdminDashboard.ts

import { AdminDashboardOutput } from "./Admin.dto";

export type AdminDashboard = AdminDashboardOutput;

export interface IGetAdminDashboard {
  execute(input: { domain: string }): Promise<AdminDashboardOutput>;
}
