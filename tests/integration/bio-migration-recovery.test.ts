import { afterEach, describe, expect, it } from "vitest";
import {
  FOUNDATION,
  INIT,
  RESTORE,
  STASH,
  createScratchDatabase,
  migrateDeploy,
  migrationSql,
  partialMigrationsConfig,
  runRecoveryScript,
  type ScratchDatabase,
} from "./migration-harness";

/**
 * `users.bio` → `profiles.bio` geçişi.
 *
 * `FOUNDATION` migration'ı dolu bir `users.bio` görünce durur (veri korunur).
 * Bu testler, duruştan veri kaybetmeden çıkılabildiğini ve geçişin tekrar
 * çalıştırmaya dayanıklı olduğunu gerçek PostgreSQL ve gerçek Prisma CLI ile
 * doğrular.
 */

const USER_WITH_BIO = "11111111-1111-1111-1111-111111111111";
const USER_WITHOUT_BIO = "22222222-2222-2222-2222-222222222222";
const USER_BLANK_BIO = "33333333-3333-3333-3333-333333333333";

const cleanups: Array<() => Promise<void> | void> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

async function scratch(label: string): Promise<ScratchDatabase> {
  const db = await createScratchDatabase(label);
  cleanups.push(() => db.drop());
  return db;
}

function partial(names: readonly string[]): string {
  const config = partialMigrationsConfig(names);
  cleanups.push(() => config.cleanup());
  return config.configPath;
}

/** Eski şemada (yalnızca init) biyografili/biyografisiz kullanıcılar ve bir yazı. */
async function seedLegacyData(db: ScratchDatabase): Promise<void> {
  await db.query(
    `INSERT INTO users (id, email, name, bio, "updatedAt") VALUES
       ($1, 'a@example.test', 'Yazar A', 'A''nın biyografisi', now()),
       ($2, 'b@example.test', 'Yazar B', NULL, now()),
       ($3, 'c@example.test', 'Yazar C', '', now())`,
    [USER_WITH_BIO, USER_WITHOUT_BIO, USER_BLANK_BIO],
  );
  await db.query(
    `INSERT INTO categories (id, name, slug, "updatedAt")
       VALUES ('44444444-4444-4444-4444-444444444444', 'Genel', 'genel', now())`,
  );
  await db.query(
    `INSERT INTO posts (id, title, slug, content, published, "publishedAt", "authorId", "categoryId", "updatedAt")
       VALUES ('55555555-5555-5555-5555-555555555555', 'Yazı', 'yazi', 'içerik', true, now(), $1,
               '44444444-4444-4444-4444-444444444444', now())`,
    [USER_WITH_BIO],
  );
}

async function initOnlyDatabaseWithBios(label: string): Promise<ScratchDatabase> {
  const db = await scratch(label);
  const result = migrateDeploy(db.url, partial([INIT]));
  expect(result.status, result.output).toBe(0);
  await seedLegacyData(db);
  return db;
}

async function profiles(db: ScratchDatabase) {
  return db.query<{ userId: string; slug: string; displayName: string; bio: string | null }>(
    `SELECT "userId", slug, "displayName", bio FROM profiles ORDER BY "userId"`,
  );
}

async function expectMigratedState(db: ScratchDatabase): Promise<void> {
  expect(await profiles(db)).toEqual([
    {
      userId: USER_WITH_BIO,
      slug: `kisi-${USER_WITH_BIO}`,
      displayName: "Yazar A",
      bio: "A'nın biyografisi",
    },
  ]);
  const posts = await db.query<{ status: string; authorId: string }>(
    `SELECT status::text AS status, "authorId" FROM posts`,
  );
  expect(posts).toEqual([{ status: "PUBLISHED", authorId: USER_WITH_BIO }]);
  expect(
    await db.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'legacy_user_bios'`),
  ).toEqual([]);
  expect(
    await db.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bio'`,
    ),
  ).toEqual([]);
  const failed = await db.query(
    `SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL`,
  );
  expect(failed).toEqual([]);
}

describe("users.bio → profiles.bio migration", () => {
  it("moves bios to the right user's profile on a direct deploy (no stop)", async () => {
    const db = await initOnlyDatabaseWithBios("direct");

    const result = migrateDeploy(db.url);

    expect(result.status, result.output).toBe(0);
    await expectMigratedState(db);
  });

  it("recovers a database already stopped by the bio guard without losing data", async () => {
    const db = await initOnlyDatabaseWithBios("stopped");

    // Eski sürüm (STASH olmadan) çalıştırılmış ve koruma devreye girmiş.
    const stopped = migrateDeploy(db.url, partial([INIT, FOUNDATION]));
    expect(stopped.status).not.toBe(0);
    expect(stopped.output).toContain("users.bio dolu kayıt içeriyor");
    expect(await db.query(`SELECT bio FROM users WHERE id = $1`, [USER_WITH_BIO])).toEqual([
      { bio: "A'nın biyografisi" },
    ]);

    // Kilit: başarısız kayıt temizlenmeden yeni deploy yapılamaz.
    const blocked = migrateDeploy(db.url);
    expect(blocked.status).not.toBe(0);
    expect(blocked.output).toContain("P3009");

    const recovery = runRecoveryScript(db.url);
    expect(recovery.status, recovery.output).toBe(0);

    const resumed = migrateDeploy(db.url);
    expect(resumed.status, resumed.output).toBe(0);
    await expectMigratedState(db);
  });

  it("is safe to re-run: no duplicate profiles, no lost bios", async () => {
    const db = await initOnlyDatabaseWithBios("rerun");
    expect(migrateDeploy(db.url).status).toBe(0);

    const again = migrateDeploy(db.url);
    expect(again.status, again.output).toBe(0);
    expect(again.output).toContain("No pending migrations");

    const recovery = runRecoveryScript(db.url);
    expect(recovery.status).not.toBe(0);
    expect(recovery.output).toContain("Kurtarma gerekmiyor");

    await db.query(migrationSql(STASH));
    await db.query(migrationSql(RESTORE));
    await expectMigratedState(db);
  });

  it("resumes after an interruption between the stash and the schema change", async () => {
    const db = await initOnlyDatabaseWithBios("interrupted");
    expect(migrateDeploy(db.url, partial([INIT, STASH])).status).toBe(0);

    // Biyografi güvenli tabloda, users.bio boşaltılmış.
    expect(await db.query(`SELECT "userId", bio FROM legacy_user_bios`)).toEqual([
      { userId: USER_WITH_BIO, bio: "A'nın biyografisi" },
    ]);

    // Aynı adım tekrar çalışsa da kayıt kaybolmaz veya çoğalmaz.
    await db.query(migrationSql(STASH));
    expect(await db.query(`SELECT count(*)::int AS n FROM legacy_user_bios`)).toEqual([{ n: 1 }]);

    const resumed = migrateDeploy(db.url);
    expect(resumed.status, resumed.output).toBe(0);
    await expectMigratedState(db);
  });

  it("never overwrites a bio already present on a profile", async () => {
    const db = await initOnlyDatabaseWithBios("keep_profile");
    expect(migrateDeploy(db.url, partial([INIT, STASH, FOUNDATION])).status).toBe(0);
    await db.query(
      `INSERT INTO profiles (id, slug, "displayName", bio, "updatedAt", "userId")
         VALUES (gen_random_uuid(), 'yazar-a', 'Yazar A', 'Panelden yazılan', now(), $1)`,
      [USER_WITH_BIO],
    );

    const result = migrateDeploy(db.url);

    expect(result.status, result.output).toBe(0);
    expect(await profiles(db)).toEqual([
      { userId: USER_WITH_BIO, slug: "yazar-a", displayName: "Yazar A", bio: "Panelden yazılan" },
    ]);
  });

  it("is a no-op on a database that already ran the foundation migration", async () => {
    const db = await scratch("already");
    expect(migrateDeploy(db.url, partial([INIT, FOUNDATION])).status).toBe(0);

    const result = migrateDeploy(db.url);

    expect(result.status, result.output).toBe(0);
    expect(await profiles(db)).toEqual([]);
    expect(
      await db.query(
        `SELECT 1 FROM information_schema.tables WHERE table_name = 'legacy_user_bios'`,
      ),
    ).toEqual([]);
  });
});
