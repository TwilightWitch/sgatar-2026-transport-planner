/**
 * @file In-memory trip store (no-database fallback).
 *
 * When `DATABASE_URL` is not configured the API routes delegate all reads and
 * writes here instead of Neon.  State persists for the lifetime of the Node.js
 * process and resets to the static schedule on server restart.
 *
 * The store is a simple singleton array protected by a `MAX_TRIPS` cap to
 * prevent unbounded memory growth from CSV uploads or ad-hoc bus creation.
 */
import type { TripWithRoute } from "@/hooks/useLiveFleet";
import { getStaticTrips } from "@/lib/staticSchedule";

/**
 * In-memory mutable schedule store.
 * Persists for the life of the server process — if the server restarts,
 * it resets to the default static schedule.
 *
 * When a real database is connected, this is unused.
 */
let mutableTrips: TripWithRoute[] | null = null;

/**
 * Returns the current in-memory trip list, initialising it from the static
 * schedule on first call.
 */
export function getTrips(): TripWithRoute[] {
  mutableTrips ??= getStaticTrips();
  return mutableTrips;
}

/**
 * Applies a partial update to the trip with the given `id`.
 * @returns The updated trip, or `null` if no trip with that id exists.
 */
export function updateTrip(
  id: string,
  patch: Partial<TripWithRoute>,
): TripWithRoute | null {
  const trips = getTrips();
  const idx = trips.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  trips[idx] = { ...trips[idx], ...patch, id: trips[idx].id };
  return trips[idx];
}

const MAX_TRIPS = 500;

/**
 * Appends a new trip to the store.
 * @returns `false` if the store is already at `MAX_TRIPS` capacity.
 */
export function addTrip(trip: TripWithRoute): boolean {
  const trips = getTrips();
  if (trips.length >= MAX_TRIPS) return false;
  trips.push(trip);
  return true;
}

/**
 * Removes the trip with the given `id` from the store.
 * @returns `false` if the id was not found.
 */
export function deleteTrip(id: string): boolean {
  const trips = getTrips();
  const idx = trips.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  trips.splice(idx, 1);
  return true;
}

/**
 * Resets the store to `null` so the next `getTrips()` call re-initialises
 * from the static schedule. Primarily used in tests.
 */
export function resetTrips(): void {
  mutableTrips = null;
}
