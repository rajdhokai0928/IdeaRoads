import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import EmbeddedPostgres from "embedded-postgres";

const execFileAsync = promisify(execFile);

// Runs once before the whole test run: spins up a fresh, ephemeral Postgres
// instance dedicated to tests (separate port/data dir from the dev database),
// creates the test database, and syncs its schema — so `pnpm test` works
// standalone with no manual setup, in local dev or CI alike.
export default async function globalSetup() {
  if (existsSync(".env.test")) {
    process.loadEnvFile(".env.test");
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set (expected from .env.test).");
  }

  const url = new URL(databaseUrl);
  const user = decodeURIComponent(url.username) || "postgres";
  const password = decodeURIComponent(url.password) || "password";
  const port = Number(url.port) || 54_350;
  const database = url.pathname.replace(/^\//, "") || "idearoads_test";
  const dataDir = path.resolve(process.cwd(), ".idearoads-postgres-test");

  // Always start from a clean data directory so test runs never inherit state
  // from a previous run that wasn't shut down cleanly.
  if (existsSync(dataDir)) {
    await rm(dataDir, { recursive: true, force: true });
  }

  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user,
    password,
    port,
    persistent: false,
  });

  await pg.initialise();
  await pg.start();
  await pg.createDatabase(database);

  // Sync the schema directly from db/schema/*.ts (drizzle-kit push), rather
  // than replaying db/migrations/*.sql. The migration history's snapshot
  // tracking is currently out of sync with the real schema (a pre-existing
  // issue, unrelated to this test suite — see conversation notes), so
  // replaying it produces bogus duplicate-table errors even on a fresh
  // database. schema.ts is the actual source of truth for what the app code
  // expects, so pushing directly from it is what keeps these tests correct.
  await execFileAsync(
    "npx",
    ["drizzle-kit", "push", "--config=drizzle.config.ts", "--force"],
    { cwd: process.cwd(), env: { ...process.env, DATABASE_URL: databaseUrl } }
  );

  return async () => {
    await pg.stop();
    await rm(dataDir, { recursive: true, force: true });
  };
}
