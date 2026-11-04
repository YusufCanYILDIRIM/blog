#!/usr/bin/env node
/**
 * `users.bio` korumasında durmuş bir veritabanını kurtarır.
 *
 * Durum: Eski sürüm `20261104120000_portfolio_auth_foundation` migration'ını
 * dolu bir users.bio ile çalıştırdı ve migration en baştaki korumada durdu.
 * Prisma bu denemeyi başarısız kaydettiği için sonraki `migrate deploy`
 * çağrıları P3009 ile reddedilir.
 *
 * Bu script `prisma migrate resolve --rolled-back` komutunu YALNIZCA şu
 * koşulların hepsi doğrulanırsa çalıştırır:
 *   1. O migration için tam bir başarısız kayıt var (bitmemiş, geri alınmamış).
 *   2. Şema değişmemiş: users.bio ve posts.published duruyor; post_status
 *      tipi, profiles ve sessions tabloları yok.
 * Koşullardan biri sağlanmazsa hiçbir şeyi değiştirmeden nedenini yazar ve
 * sıfır olmayan kodla çıkar. Veriye dokunmaz; biyografiler bir sonraki
 * `npm run prisma:deploy` sırasında profillere taşınır.
 *
 * Kullanım: DATABASE_URL=... npm run prisma:recover-bio-guard
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import pg from "pg";

const MIGRATION = "20261104120000_portfolio_auth_foundation";

try {
  process.loadEnvFile();
} catch {
  // .env yok — DATABASE_URL ortamdan gelir.
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL tanımlı değil.");
  process.exit(2);
}

async function inspect(client) {
  const exists = async (sql, params) => (await client.query(sql, params)).rowCount > 0;
  const hasMigrationsTable = await exists(
    `SELECT 1 FROM to_regclass('_prisma_migrations') t WHERE t IS NOT NULL`,
  );
  const attempts = hasMigrationsTable
    ? (
        await client.query(
          `SELECT finished_at IS NULL AND rolled_back_at IS NULL AS failed,
                  finished_at IS NOT NULL AS applied
             FROM _prisma_migrations WHERE migration_name = $1`,
          [MIGRATION],
        )
      ).rows
    : [];
  const column = (table, name) =>
    exists(
      `SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = $1 AND column_name = $2`,
      [table, name],
    );
  return {
    failedCount: attempts.filter((row) => row.failed).length,
    applied: attempts.some((row) => row.applied),
    usersBio: await column("users", "bio"),
    postsPublished: await column("posts", "published"),
    postStatusType: await exists(`SELECT 1 FROM pg_type WHERE typname = 'post_status'`),
    profilesTable: await exists(`SELECT 1 FROM to_regclass('profiles') t WHERE t IS NOT NULL`),
    sessionsTable: await exists(`SELECT 1 FROM to_regclass('sessions') t WHERE t IS NOT NULL`),
  };
}

function refuse(message) {
  console.error(`Kurtarma uygulanmadı: ${message}`);
  process.exit(1);
}

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
let state;
try {
  state = await inspect(client);
} finally {
  await client.end();
}

if (state.applied || state.failedCount === 0) {
  refuse(`Kurtarma gerekmiyor — ${MIGRATION} için başarısız kayıt yok.`);
}
if (state.failedCount !== 1) {
  refuse(`${MIGRATION} için ${state.failedCount} başarısız kayıt var; elle incelenmeli.`);
}
const unchanged =
  state.usersBio &&
  state.postsPublished &&
  !state.postStatusType &&
  !state.profilesTable &&
  !state.sessionsTable;
if (!unchanged) {
  refuse(
    `şema migration öncesi durumda değil (${JSON.stringify(state)}). ` +
      "Kısmi değişiklik olabilir; resolve güvenli değil, elle incelenmeli.",
  );
}

console.log(
  `${MIGRATION}: başarısız kayıt ve değişmemiş şema doğrulandı; geri alındı olarak işaretleniyor.`,
);
const prismaCli = createRequire(import.meta.url).resolve("prisma/build/index.js");
const result = spawnSync(
  process.execPath,
  [prismaCli, "migrate", "resolve", "--rolled-back", MIGRATION],
  { stdio: "inherit", env: process.env },
);
if (result.status !== 0) process.exit(result.status ?? 1);
console.log("Tamam. Şimdi `npm run prisma:deploy` çalıştırın; biyografiler profillere taşınacak.");
