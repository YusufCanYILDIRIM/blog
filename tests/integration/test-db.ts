import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/prisma/generated/client";

/**
 * Entegrasyon testleri için Prisma istemcisi. `lib/prisma.ts` `server-only`
 * olduğundan test ortamında doğrudan kullanılamaz; burada aynı adapter ile
 * ayrı bir istemci kurulur.
 *
 * Güvenlik: testler tabloları TRUNCATE eder. Yanlışlıkla geliştirme veya
 * production veritabanına bağlanmamak için yalnızca adı `_test` ile biten
 * bir veritabanı kabul edilir.
 */
export function getTestDatabaseUrl(): string {
  const raw = process.env["TEST_DATABASE_URL"];
  if (!raw) {
    throw new Error(
      "TEST_DATABASE_URL tanımlı değil. Migration'ları uygulanmış izole bir test veritabanı gerekir.",
    );
  }
  const databaseName = new URL(raw).pathname.replace(/^\//, "");
  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Güvenlik: test veritabanının adı "_test" ile bitmeli (bulunan: "${databaseName}").`,
    );
  }
  return raw;
}

export function createTestClient(): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: getTestDatabaseUrl() }) });
}

/** Tüm tabloları bağımlılık sırasıyla (çocuktan ebeveyne) boşaltır. */
export async function resetDatabase(client: PrismaClient): Promise<void> {
  await client.$transaction([
    client.postTag.deleteMany(),
    client.comment.deleteMany(),
    client.post.deleteMany(),
    client.tag.deleteMany(),
    client.category.deleteMany(),
    client.profile.deleteMany(),
    client.session.deleteMany(),
    client.account.deleteMany(),
    client.verification.deleteMany(),
    client.user.deleteMany(),
  ]);
}
