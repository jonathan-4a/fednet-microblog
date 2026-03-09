// src/schema.ts
import { sql, type Kysely } from "kysely";

import { createUserSchema, type UsersTable } from "@users";
import { createCredentialsSchema, type CredentialsTable } from "@auth";
import { createTokenBlacklistSchema, type TokenBlacklistTable } from "@auth";
import { createInviteTokensSchema, type InviteTokensTable } from "@auth";
import { createServerSettingsSchema, type ServerSettingsTable } from "@shared";
import { createPostSchema, type PostsTable } from "@posts";
import { createAnnouncesSchema, type AnnouncesTable } from "@posts";
import { createLikesSchema, type LikesTable } from "@posts";
import { createFollowSchema, type FollowsTable } from "@socials";
import {
  createNotificationSchema,
  type NotificationsTable,
} from "@notifications";

export interface DbTables {
  users: UsersTable;
  credentials: CredentialsTable;
  token_blacklist: TokenBlacklistTable;
  posts: PostsTable;
  announces: AnnouncesTable;
  server_settings: ServerSettingsTable;
  invite_tokens: InviteTokensTable;
  follows: FollowsTable;
  likes: LikesTable;
  notifications: NotificationsTable;
}

export async function ensureSchema(db: Kysely<DbTables>): Promise<void> {
  await sql`PRAGMA foreign_keys = ON`.execute(db);
  await createUserSchema<DbTables>(db);
  await createCredentialsSchema<DbTables>(db);
  await createTokenBlacklistSchema<DbTables>(db);
  await createServerSettingsSchema<DbTables>(db);
  await createInviteTokensSchema<DbTables>(db);
  await createPostSchema<DbTables>(db);
  await createAnnouncesSchema<DbTables>(db);
  await createLikesSchema<DbTables>(db);
  await createFollowSchema<DbTables>(db);
  await createNotificationSchema<DbTables>(db);
}
