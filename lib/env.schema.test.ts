import { describe, expect, it } from "vitest";
import { EnvValidationError, parsePublicEnv, parseServerEnv } from "@/lib/env.schema";

const VALID_DB = "postgresql://user:pass@127.0.0.1:5432/blog_dev?schema=public";

describe("parseServerEnv", () => {
  it("accepts a postgres connection string and defaults NODE_ENV", () => {
    expect(parseServerEnv({ DATABASE_URL: VALID_DB })).toEqual({
      DATABASE_URL: VALID_DB,
      NODE_ENV: "development",
    });
  });

  it("fails with the variable name when DATABASE_URL is missing", () => {
    expect(() => parseServerEnv({})).toThrowError(EnvValidationError);
    expect(() => parseServerEnv({})).toThrowError(/DATABASE_URL: zorunlu/);
  });

  it("rejects non-PostgreSQL databases", () => {
    expect(() => parseServerEnv({ DATABASE_URL: "mysql://u:p@localhost/db" })).toThrowError(
      /DATABASE_URL: postgres:\/\/ veya postgresql:\/\//,
    );
  });

  it("never includes the rejected value in the error message", () => {
    const secret = "S3cr3t-should-not-leak";
    const attempt = () => parseServerEnv({ DATABASE_URL: `mysql://admin:${secret}@db/prod` });
    expect(attempt).toThrowError(EnvValidationError);
    try {
      attempt();
    } catch (error) {
      expect(String(error)).not.toContain(secret);
    }
  });

  it("rejects an unknown NODE_ENV", () => {
    expect(() => parseServerEnv({ DATABASE_URL: VALID_DB, NODE_ENV: "staging" })).toThrowError(
      /NODE_ENV/,
    );
  });
});

describe("parsePublicEnv", () => {
  it("requires NEXT_PUBLIC_APP_URL in production", () => {
    expect(() =>
      parsePublicEnv({ NEXT_PUBLIC_APP_URL: undefined, NODE_ENV: "production" }),
    ).toThrowError(/NEXT_PUBLIC_APP_URL: zorunlu/);
  });

  it("falls back to localhost outside production", () => {
    expect(parsePublicEnv({ NEXT_PUBLIC_APP_URL: undefined, NODE_ENV: "development" })).toEqual({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });
  });

  it("rejects an invalid URL even outside production", () => {
    expect(() =>
      parsePublicEnv({ NEXT_PUBLIC_APP_URL: "not a url", NODE_ENV: "development" }),
    ).toThrowError(/geçerli bir URL/);
  });

  it("exposes only public keys, never server secrets", () => {
    const result = parsePublicEnv({
      NEXT_PUBLIC_APP_URL: "https://example.test",
      NODE_ENV: "production",
    });
    expect(Object.keys(result)).toEqual(["NEXT_PUBLIC_APP_URL"]);
  });
});
