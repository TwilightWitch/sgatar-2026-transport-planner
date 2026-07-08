/**
 * @file Idempotent migration — adds delegate broadcast field to active trips.
 *
 * Run once with:
 *   npx tsx src/db/migrate-add-delegate-notice.ts
 */
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: "../.env", override: false });

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  await sql`
    ALTER TABLE active_trips
      ADD COLUMN IF NOT EXISTS delegate_notice TEXT;
  `;

  console.log("Migration complete: active_trips.delegate_notice is available.");
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
