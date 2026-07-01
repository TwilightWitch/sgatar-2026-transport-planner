/**
 * @file Database client.
 *
 * Creates a single shared Drizzle ORM instance backed by the Neon serverless
 * HTTP driver. The connection string is read from `DATABASE_URL` at runtime.
 *
 * Import `db` from this module anywhere server-side database access is needed.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL ?? "");
export const db = drizzle(sql, { schema });
