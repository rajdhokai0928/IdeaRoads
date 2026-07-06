import postgres from "postgres";
import { env } from "@/lib/env";

// Destructive: drops every table. Refuse to run against anything that looks
// like a production database, and require explicit opt-in via CONFIRM_RESET=1
// so it can never be triggered accidentally (e.g. from another script).
if (env.NODE_ENV === "production") {
  throw new Error("db/reset.ts refuses to run with NODE_ENV=production.");
}
if (process.env.CONFIRM_RESET !== "1") {
  throw new Error(
    `db/reset.ts will DROP ALL DATA in ${env.DATABASE_URL}. ` +
      "Re-run with CONFIRM_RESET=1 if you are sure."
  );
}

const sql = postgres(env.DATABASE_URL);

console.log("Dropping public and drizzle schemas...");
await sql`DROP SCHEMA public CASCADE`;
await sql`CREATE SCHEMA public`;
await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
await sql.end();
console.log("Database reset complete.");
