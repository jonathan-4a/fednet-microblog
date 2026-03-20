// src/connection.ts
//
// ── Database Connection & Dialect Abstraction ─────────────────────────────────
//
// This file is the ONLY place in the codebase that is database-specific.
// To switch databases, add a new dialect entry to the `dialects` registry
// and set DB_DIALECT in your environment.
//
// ── Why the compiler patches? ─────────────────────────────────────────────────
//
// Kysely is agnostic for queries (select, insert, update, delete) but its
// schema builder (.autoIncrement()) emits MySQL syntax regardless of dialect.
// Each compiler patch intercepts column definition building at compile time
// and emits the correct auto-increment syntax for that database:
//
//   Postgres  → serial
//   SQLite    → integer primary key (implicit, no patch needed)
//   MySQL     → int auto_increment  (add when needed, see below)
//
// ── Adding a new database ─────────────────────────────────────────────────────
//
// 1. Install the driver:        bun add <driver>
// 2. Import the dialect and query compiler from kysely
// 3. Write a compiler patch that overrides visitColumnDefinition
//    and emits the correct auto-increment syntax for that database
// 4. Add an entry to the `dialects` registry below
// 5. Set DB_DIALECT=<your dialect> in your environment
//
// ── Environment variables ─────────────────────────────────────────────────────
//
//   DB_DIALECT    Optional. One of: postgres, sqlite. If unset: postgres when
//                 DATABASE_URL is set, otherwise sqlite (DB_PATH defaults to ./node.db)
//   DATABASE_URL  Required for postgres. e.g. postgresql://user:pass@host:5432/db
//   DB_PATH       SQLite file path. Defaults to ./node.db when using sqlite
//
// ─────────────────────────────────────────────────────────────────────────────

import {
  Kysely,
  PostgresDialect,
  PostgresQueryCompiler,
  type PostgresDialectConfig,
} from "kysely";
import { Pool as PgPool } from "pg";
import { BunSqliteDialect } from "@meck93/kysely-bun-sqlite";
import { Database } from "bun:sqlite";
import path from "path";
import type { DbTables } from "./schema";

// ── Compiler Patches ──────────────────────────────────────────────────────────
//
// Each patch subclasses the dialect's query compiler and overrides
// visitColumnDefinition to emit the correct auto-increment syntax.
// The schema files never need to change when switching databases.

type ColumnDefNode = Parameters<
  PostgresQueryCompiler["visitColumnDefinition"]
>[0];

class PostgresCompiler extends PostgresQueryCompiler {
  protected override getAutoIncrement(): string {
    return "";
  }
  protected override visitColumnDefinition(node: ColumnDefNode): void {
    if (node.ifNotExists) this.append("if not exists ");
    this.visitNode(node.column);
    this.append(" ");
    if (node.autoIncrement) this.append("serial");
    else this.visitNode(node.dataType);
    if (node.unsigned) this.append(" unsigned");
    if (node.frontModifiers?.length) {
      this.append(" ");
      this.compileList(node.frontModifiers, " ");
    }
    if (node.generated) {
      this.append(" ");
      this.visitNode(node.generated);
    }
    if (node.identity) this.append(" identity");
    if (node.defaultTo) {
      this.append(" ");
      this.visitNode(node.defaultTo);
    }
    if (node.notNull) this.append(" not null");
    if (node.unique) this.append(" unique");
    if (node.nullsNotDistinct) this.append(" nulls not distinct");
    if (node.primaryKey) this.append(" primary key");
    if (node.references) {
      this.append(" ");
      this.visitNode(node.references);
    }
    if (node.check) {
      this.append(" ");
      this.visitNode(node.check);
    }
    if (node.endModifiers?.length) {
      this.append(" ");
      this.compileList(node.endModifiers, " ");
    }
  }
}

// SQLite: no patch needed — `integer primary key` is implicitly auto-increment.

// MySQL: uncomment when needed.
// import { MysqlDialect, MysqlQueryCompiler, type MysqlDialectConfig } from "kysely";
// import { createPool as createMysqlPool } from "mysql2";
// type MysqlColumnDefNode = Parameters<MysqlQueryCompiler["visitColumnDefinition"]>[0];
// class MysqlCompiler extends MysqlQueryCompiler {
//   protected override getAutoIncrement(): string { return ""; }
//   protected override visitColumnDefinition(node: MysqlColumnDefNode): void {
//     if (node.ifNotExists) this.append("if not exists ");
//     this.visitNode(node.column);
//     this.append(" ");
//     if (node.autoIncrement) this.append("int");
//     else this.visitNode(node.dataType);
//     if (node.unsigned) this.append(" unsigned");
//     if (node.frontModifiers?.length) { this.append(" "); this.compileList(node.frontModifiers, " "); }
//     if (node.generated) { this.append(" "); this.visitNode(node.generated); }
//     if (node.defaultTo) { this.append(" "); this.visitNode(node.defaultTo); }
//     if (node.notNull) this.append(" not null");
//     if (node.unique) this.append(" unique");
//     if (node.primaryKey) this.append(" primary key");
//     if (node.autoIncrement) this.append(" auto_increment");
//     if (node.references) { this.append(" "); this.visitNode(node.references); }
//     if (node.check) { this.append(" "); this.visitNode(node.check); }
//     if (node.endModifiers?.length) { this.append(" "); this.compileList(node.endModifiers, " "); }
//   }
// }

// ── Dialect Registry ──────────────────────────────────────────────────────────
//
// Add new databases here. Each entry is a factory function that returns a
// configured Kysely instance. The DB_DIALECT env var selects which one to use.

const dialects: Record<string, () => Kysely<DbTables>> = {
  postgres: () =>
    new Kysely<DbTables>({
      dialect: new (class extends PostgresDialect {
        override createQueryCompiler() {
          return new PostgresCompiler();
        }
      })({
        pool: new PgPool({ connectionString: process.env.DATABASE_URL }),
      } satisfies PostgresDialectConfig),
    }),

  sqlite: () =>
    new Kysely<DbTables>({
      dialect: new BunSqliteDialect({
        database: new Database(
          path.resolve(process.cwd(), process.env.DB_PATH!),
        ),
      }),
    }),

  // mysql: () =>
  //   new Kysely<DbTables>({
  //     dialect: new (class extends MysqlDialect {
  //       override createQueryCompiler() { return new MysqlCompiler(); }
  //     })({
  //       pool: createMysqlPool({ uri: process.env.DATABASE_URL }),
  //     } satisfies MysqlDialectConfig),
  //   }),
};

// ── Factory ───────────────────────────────────────────────────────────────────

function resolveDialectKey(): string {
  const explicit = process.env.DB_DIALECT?.trim();
  if (explicit) {
    if (!dialects[explicit]) {
      throw new Error(
        `Invalid DB_DIALECT "${explicit}". Use: ${Object.keys(dialects).join(", ")}`,
      );
    }
    return explicit;
  }
  if (process.env.DATABASE_URL?.trim()) return "postgres";
  return "sqlite";
}

function createDatabase(): Kysely<DbTables> {
  const key = resolveDialectKey();
  if (key === "sqlite" && !process.env.DB_PATH?.trim()) {
    process.env.DB_PATH = "./node.db";
  }
  if (key === "postgres" && !process.env.DATABASE_URL?.trim()) {
    throw new Error(
      "DATABASE_URL is required for postgres (or omit DB_DIALECT and DATABASE_URL to use sqlite with DB_PATH)",
    );
  }
  console.log(`[DB] Connecting via ${key}`);
  return dialects[key]();
}

export const db = createDatabase();
