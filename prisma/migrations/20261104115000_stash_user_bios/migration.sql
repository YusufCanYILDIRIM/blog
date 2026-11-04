-- users.bio → profiles.bio geçişi, adım 1/2: biyografileri güvenli tabloya al.
--
-- 20261104120000_portfolio_auth_foundation, dolu bir users.bio görünce durur;
-- profiles tablosu o migration içinde oluşturulduğu için biyografi önceden
-- taşınamaz. Bu adım biyografiyi legacy_user_bios tablosuna kopyalar ve
-- users.bio alanını boşaltır; böylece koruma geçer ve veri kaybolmaz.
-- Adım 2 (20261104130000_restore_user_bios) biyografiyi profile yazar.
--
-- Tekrar çalıştırmak güvenlidir. users.bio sütunu yoksa (foundation zaten
-- uygulanmışsa; Prisma bu migration'ı sonradan da uygulayabilir) hiçbir şey yapmaz.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'bio'
  ) THEN
    RETURN;
  END IF;

  CREATE TABLE IF NOT EXISTS "legacy_user_bios" (
    "userId" UUID NOT NULL PRIMARY KEY,
    "bio"    TEXT NOT NULL
  );

  INSERT INTO "legacy_user_bios" ("userId", "bio")
  SELECT "id", "bio" FROM "users" WHERE "bio" IS NOT NULL AND "bio" <> ''
  ON CONFLICT ("userId") DO UPDATE SET "bio" = EXCLUDED."bio";

  UPDATE "users" SET "bio" = NULL WHERE "bio" IS NOT NULL;
END $$;
