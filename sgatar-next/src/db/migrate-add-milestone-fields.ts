/**
 * @file Idempotent migration — adds milestone-tracking fields to the live DB.
 *
 * Run once with:
 *   npx tsx src/db/migrate-add-milestone-fields.ts
 *
 * The script is safe to re-run: every ALTER is wrapped in `IF NOT EXISTS` so
 * columns that already exist are skipped.
 *
 * Fields added:
 *  routes:         route_type, flight_number, terminal, pickup_instructions
 *  active_trips:   driver_name, driver_phone, plate_number,
 *                  assigned_delegations, sos_message
 *  headcount_logs: status_context (new NOT NULL column, backfilled with 'scheduled')
 *
 * Enum values added to trip_status:
 *   departed_origin, arrived_destination
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

  console.log("Starting idempotent migration…");

  // ── 1. Add new enum values ──────────────────────────────────────────────
  // ALTER TYPE ... ADD VALUE is idempotent in Postgres 14+ with IF NOT EXISTS
  await sql`
    DO $$ BEGIN
      ALTER TYPE trip_status ADD VALUE IF NOT EXISTS 'departed_origin';
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `;
  await sql`
    DO $$ BEGIN
      ALTER TYPE trip_status ADD VALUE IF NOT EXISTS 'arrived_destination';
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `;
  console.log("✓ Enum values: departed_origin, arrived_destination");

  // ── 2. routes table ─────────────────────────────────────────────────────
  await sql`
    ALTER TABLE routes
      ADD COLUMN IF NOT EXISTS route_type        VARCHAR(32) DEFAULT 'shuttle',
      ADD COLUMN IF NOT EXISTS flight_number     VARCHAR(32),
      ADD COLUMN IF NOT EXISTS terminal          VARCHAR(16),
      ADD COLUMN IF NOT EXISTS pickup_instructions TEXT;
  `;
  console.log("✓ routes: route_type, flight_number, terminal, pickup_instructions");

  // ── 3. active_trips table ───────────────────────────────────────────────
  await sql`
    ALTER TABLE active_trips
      ADD COLUMN IF NOT EXISTS driver_name          VARCHAR(64),
      ADD COLUMN IF NOT EXISTS driver_phone         VARCHAR(32),
      ADD COLUMN IF NOT EXISTS plate_number         VARCHAR(16),
      ADD COLUMN IF NOT EXISTS assigned_delegations TEXT[],
      ADD COLUMN IF NOT EXISTS sos_message          TEXT;
  `;
  console.log("✓ active_trips: driver_name, driver_phone, plate_number, assigned_delegations, sos_message");

  // ── 4. headcount_logs table — backfill then add NOT NULL constraint ─────
  // Step 1: Add as nullable first so existing rows are unaffected
  await sql`
    ALTER TABLE headcount_logs
      ADD COLUMN IF NOT EXISTS status_context trip_status;
  `;
  // Step 2: Backfill existing NULL rows with 'scheduled'
  await sql`
    UPDATE headcount_logs
    SET status_context = 'scheduled'
    WHERE status_context IS NULL;
  `;
  // Step 3: Apply NOT NULL now that no NULLs remain
  // This is a no-op if the constraint already exists
  await sql`
    DO $$ BEGIN
      ALTER TABLE headcount_logs ALTER COLUMN status_context SET NOT NULL;
    EXCEPTION WHEN others THEN NULL; END $$;
  `;
  console.log("✓ headcount_logs: status_context (backfilled + NOT NULL)");

  console.log("\nMigration complete.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
