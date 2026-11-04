import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestClient, resetDatabase } from "./test-db";

/**
 * Veri modelinin değişmez kuralları (bkz. prisma/schema.prisma başlığı ve
 * docs/adr/0001-auth-better-auth.md). Kurallar veritabanı kısıtlarıyla
 * uygulandığı için gerçek PostgreSQL'e karşı doğrulanır.
 */
const db = createTestClient();

beforeEach(async () => {
  await resetDatabase(db);
});

afterAll(async () => {
  await db.$disconnect();
});

async function createAuthor(email: string) {
  return db.user.create({ data: { email, name: email.split("@")[0] ?? email } });
}

describe("user deletion never cascades to content", () => {
  it("refuses to delete a user who still owns posts", async () => {
    const author = await createAuthor("a@example.test");
    await db.post.create({
      data: { title: "T", slug: "t", content: "c", authorId: author.id },
    });

    await expect(db.user.delete({ where: { id: author.id } })).rejects.toThrow();
    expect(await db.post.count({ where: { authorId: author.id } })).toBe(1);
  });

  it("refuses to delete a user who has a public profile", async () => {
    const author = await createAuthor("b@example.test");
    await db.profile.create({
      data: { userId: author.id, slug: "yazar-b", displayName: "Yazar B" },
    });

    await expect(db.user.delete({ where: { id: author.id } })).rejects.toThrow();
    expect(await db.profile.count()).toBe(1);
  });

  it("removes only auth records (sessions, accounts) when a content-free user is deleted", async () => {
    const user = await createAuthor("c@example.test");
    await db.account.create({
      data: { userId: user.id, providerId: "github", accountId: "1001" },
    });
    await db.session.create({
      data: { userId: user.id, token: "tok-c", expiresAt: new Date(Date.now() + 60_000) },
    });

    await db.user.delete({ where: { id: user.id } });

    expect(await db.account.count()).toBe(0);
    expect(await db.session.count()).toBe(0);
  });
});

describe("account deactivation", () => {
  it("new users are active and deactivation keeps their content", async () => {
    const author = await createAuthor("d@example.test");
    expect(author.active).toBe(true);
    await db.post.create({
      data: { title: "T", slug: "t-d", content: "c", authorId: author.id },
    });

    await db.user.update({ where: { id: author.id }, data: { active: false } });

    expect(await db.post.count({ where: { authorId: author.id } })).toBe(1);
  });
});

describe("posts", () => {
  it("start as drafts without a publish date", async () => {
    const author = await createAuthor("e@example.test");
    const post = await db.post.create({
      data: { title: "T", slug: "t-e", content: "c", authorId: author.id },
    });
    expect(post.status).toBe("DRAFT");
    expect(post.publishedAt).toBeNull();
  });

  it("keep existing after their category is deleted", async () => {
    const author = await createAuthor("f@example.test");
    const category = await db.category.create({ data: { name: "Genel", slug: "genel" } });
    const post = await db.post.create({
      data: {
        title: "T",
        slug: "t-f",
        content: "c",
        authorId: author.id,
        categoryId: category.id,
      },
    });

    await db.category.delete({ where: { id: category.id } });

    const after = await db.post.findUniqueOrThrow({ where: { id: post.id } });
    expect(after.categoryId).toBeNull();
  });

  it("enforce unique slugs", async () => {
    const author = await createAuthor("g@example.test");
    await db.post.create({ data: { title: "A", slug: "ayni", content: "c", authorId: author.id } });
    await expect(
      db.post.create({ data: { title: "B", slug: "ayni", content: "c", authorId: author.id } }),
    ).rejects.toThrow();
  });
});

describe("provider identity", () => {
  it("links one GitHub account id to at most one user", async () => {
    const first = await createAuthor("h@example.test");
    const second = await createAuthor("i@example.test");
    await db.account.create({
      data: { userId: first.id, providerId: "github", accountId: "4242" },
    });

    await expect(
      db.account.create({ data: { userId: second.id, providerId: "github", accountId: "4242" } }),
    ).rejects.toThrow();
  });

  it("allows only one profile per user", async () => {
    const author = await createAuthor("j@example.test");
    await db.profile.create({ data: { userId: author.id, slug: "j1", displayName: "J" } });
    await expect(
      db.profile.create({ data: { userId: author.id, slug: "j2", displayName: "J" } }),
    ).rejects.toThrow();
  });
});
