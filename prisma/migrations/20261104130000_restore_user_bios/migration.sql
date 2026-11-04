-- users.bio → profiles.bio geçişi, adım 2/2: biyografileri profillere yaz.
--
-- legacy_user_bios'taki her kayıt, aynı kullanıcının profiline yazılır:
-- - Profil yoksa oluşturulur: slug = 'kisi-<userId>' (UUID, benzersiz; panelden
--   değiştirilebilir), displayName = users.name.
-- - Profil varsa ve biyografisi doluysa EZİLMEZ; yalnızca boşsa doldurulur.
-- Ardından geçici tablo silinir. Tekrar çalıştırmak güvenlidir; tablo yoksa
-- hiçbir şey yapmaz.
DO $$
BEGIN
  IF to_regclass('legacy_user_bios') IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO "profiles" ("id", "slug", "displayName", "bio", "updatedAt", "userId")
  SELECT gen_random_uuid(), 'kisi-' || l."userId"::text, u."name", l."bio", CURRENT_TIMESTAMP, l."userId"
  FROM "legacy_user_bios" l
  JOIN "users" u ON u."id" = l."userId"
  ON CONFLICT ("userId") DO UPDATE
    SET "bio" = COALESCE(NULLIF("profiles"."bio", ''), EXCLUDED."bio"),
        "updatedAt" = CASE
          WHEN NULLIF("profiles"."bio", '') IS NULL THEN CURRENT_TIMESTAMP
          ELSE "profiles"."updatedAt"
        END;

  DROP TABLE "legacy_user_bios";
END $$;
