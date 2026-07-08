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
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type AppDb = NeonHttpDatabase<typeof schema>;

let dbInstance: AppDb | null = null;

function createDb(): AppDb {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error(
			"DATABASE_URL is not set. Configure a database connection string before using the database client.",
		);
	}

	const sql = neon(databaseUrl);
	return drizzle(sql, { schema });
}

export function getDb(): AppDb {
	if (!dbInstance) {
		dbInstance = createDb();
	}
	return dbInstance;
}

export const db: AppDb = new Proxy({} as AppDb, {
	get(_target, prop, receiver) {
		const instance = getDb() as unknown as Record<PropertyKey, unknown>;
		const value = Reflect.get(instance, prop, receiver);
		return typeof value === "function" ? value.bind(instance) : value;
	},
});
