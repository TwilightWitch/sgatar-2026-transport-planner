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

export function getTrips(): TripWithRoute[] {
  if (!mutableTrips) {
    mutableTrips = getStaticTrips();
  }
  return mutableTrips;
}

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

export function addTrip(trip: TripWithRoute): void {
  const trips = getTrips();
  trips.push(trip);
}

export function deleteTrip(id: string): boolean {
  const trips = getTrips();
  const idx = trips.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  trips.splice(idx, 1);
  return true;
}

export function resetTrips(): void {
  mutableTrips = null;
}
