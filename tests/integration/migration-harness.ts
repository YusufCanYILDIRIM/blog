import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import pg from "pg";
import { getTestDatabaseUrl } from "./test-db";

/**
 * Migration senaryoları için geçici, izole veritabanları ve migration klasörleri.
 *
 * - Her veritabanı `TEST_DATABASE_URL` sunucusunda oluşturulur, adı `_test` ile
 *   biter ve test sonunda silinir; ana test veritabanına dokunulmaz.
 * - Kısmi migration geçmişleri (ör. yalnızca init) için migration klasörleri
 *   `.cache/` altına (gitignore) kopyalanır. Prisma config'i `prisma/config`
 *   modülünü çözebilsin diye klasör proje içinde olmalıdır.
 */
const ROOT = resolve(import.meta.dirname, "../..");
const MIGRATIONS = join(ROOT, "prisma/migrations");
const PRISMA_CLI = createRequire(import.meta.url).resolve("prisma/build/index.js");

export const INIT = "20260721082519_init_blog_schema";
export const STASH = "20261104115000_stash_user_bios";
export const FOUNDATION = "20261104120000_portfolio_auth_foundation";
export const RESTORE = "20261104130000_restore_user_bios";

export interface CommandResult {
  readonly status: number | null;
  readonly output: string;
}

function serverUrl(database: string): string {
  const url = new URL(getTestDatabaseUrl());
  url.pathname = `/${database}`;
  return url.toString();
}

export interface ScratchDatabase {
  readonly name: string;
  readonly url: string;
  query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    sql: string,
    params?: unknown[],
  ): Promise<T[]>;
  drop(): Promise<void>;
}

async function withAdmin<T>(fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: getTestDatabaseUrl() });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function createScratchDatabase(label: string): Promise<ScratchDatabase> {
  const name = `mig_${label}_${randomUUID().slice(0, 8)}_test`;
  if (!/^[a-z0-9_]+$/.test(name)) throw new Error(`Geçersiz veritabanı adı: ${name}`);
  await withAdmin((admin) => admin.query(`CREATE DATABASE "${name}"`));
  const url = serverUrl(name);
  return {
    name,
    url,
    async query(sql, params) {
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      try {
        return (await client.query(sql, params)).rows;
      } finally {
        await client.end();
      }
    },
    async drop() {
      await withAdmin((admin) => admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`));
    },
  };
}

/** Yalnızca verilen migration'ları içeren geçici bir Prisma config'i üretir. */
export function partialMigrationsConfig(migrationNames: readonly string[]): {
  readonly configPath: string;
  cleanup(): void;
} {
  const dir = join(ROOT, ".cache", `migrations-${randomUUID().slice(0, 8)}`);
  const cleanup = () => rmSync(dir, { recursive: true, force: true });
  const configPath = join(dir, "prisma.config.ts");
  try {
    mkdirSync(join(dir, "migrations"), { recursive: true });
    cpSync(join(MIGRATIONS, "migration_lock.toml"), join(dir, "migrations/migration_lock.toml"));
    for (const name of migrationNames) {
      cpSync(join(MIGRATIONS, name), join(dir, "migrations", name), { recursive: true });
    }
    writeFileSync(
      configPath,
      [
        'import { defineConfig } from "prisma/config";',
        "export default defineConfig({",
        `  schema: ${JSON.stringify(join(ROOT, "prisma/schema.prisma"))},`,
        '  migrations: { path: "./migrations" },',
        '  datasource: { url: process.env["DATABASE_URL"] ?? "" },',
        "});",
        "",
      ].join("\n"),
    );
  } catch (error) {
    // Kopyalama yarıda kalırsa klasör geride bırakılmaz.
    cleanup();
    throw error;
  }
  return { configPath, cleanup };
}

function run(command: string, args: readonly string[], databaseUrl: string): CommandResult {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8",
  });
  return { status: result.status, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

/** `prisma migrate deploy`; `configPath` verilmezse projenin tam migration geçmişi kullanılır. */
export function migrateDeploy(databaseUrl: string, configPath?: string): CommandResult {
  const args = [PRISMA_CLI, "migrate", "deploy"];
  if (configPath) args.push("--config", configPath);
  return run(process.execPath, args, databaseUrl);
}

export function runRecoveryScript(databaseUrl: string): CommandResult {
  return run(process.execPath, [join(ROOT, "scripts/recover-bio-guard.mjs")], databaseUrl);
}

/** Bir migration'ın SQL içeriği (tekrar çalıştırma testleri için). */
export function migrationSql(name: string): string {
  return readFileSync(join(MIGRATIONS, name, "migration.sql"), "utf8");
}
