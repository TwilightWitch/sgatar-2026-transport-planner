/**
 * @file Live fleet data hooks.
 *
 * Provides three React Query hooks consumed throughout the app:
 *
 * - {@link useActiveTrips}    — Polls `/api/trips` every 4 s and returns the
 *   full `TripWithRoute[]` list.  All portals share this single cached query.
 *
 * - {@link useUpdateHeadcount} — Mutation hook that PATCHes a single trip.  It
 *   applies an optimistic update immediately, rolls back on error, and queues
 *   changes in `localStorage` when the device is offline so they are replayed
 *   once connectivity is restored.
 *
 * - {@link useDelegateFleet} — Filtered view of `useActiveTrips` scoped to a
 *   delegate's country, or the general pool when no country is selected.
 *
 * Also exports the {@link TripWithRoute} shape that is the canonical data
 * contract between the API and all UI components.
 */
"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";

/**
 * Canonical data contract between the `/api/trips` endpoint and all UI components.
 *
 * Combines fields from both `active_trips` and the joined `routes` row so every
 * consumer has a single, flat object to work with.
 */
export interface TripWithRoute {
  id: string;
  routeId: string;
  busIdentifier: string;
  maxCapacity: number;
  currentPax: number;
  assignedLoCount: number;
  /** Current milestone status of the trip lifecycle. */
  status:
    | "scheduled"
    | "boarding"
    | "departed_origin"
    | "en_route"
    | "delayed"
    | "arrived_destination"
    | "completed";
  actualDepartureTime: string | null;
  actualArrivalTime: string | null;
  operationalNote: string | null;
  isSos: boolean;
  sosMessage: string | null;
  isAdhoc: boolean;
  // Driver / vehicle identity
  driverName: string | null;
  driverPhone: string | null;
  plateNumber: string | null;
  /**
   * ISO 3166-1 alpha-3 country codes bound to this trip.
   * `null` or empty array means the trip is in the general delegate pool.
   */
  assignedDelegations: string[] | null;
  // Route / schedule fields joined from the `routes` table
  conferenceDay: string;
  serviceName: string;
  targetArrival: string;
  pickupLocation: string;
  dropoffLocation: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  /**
   * Discriminator for route category.
   * - `'shuttle'`           — Regular conference shuttle between venues/hotels.
   * - `'airport_arrival'`   — Airport pick-up run (delegates landing).
   * - `'airport_departure'` — Airport drop-off run (delegates departing).
   */
  routeType: "shuttle" | "airport_arrival" | "airport_departure" | null;
  /** IATA flight number; populated for airport transfer routes only. */
  flightNumber: string | null;
  /** Airport terminal identifier (e.g. "T3") for airport transfer routes. */
  terminal: string | null;
  /** Human-readable wayfinding instruction shown to delegates. */
  pickupInstructions: string | null;
}

/** Payload sent to `PATCH /api/trips/[id]` by the LO portal. */
interface HeadcountUpdate {
  tripId: string;
  currentPax: number;
  status?: TripWithRoute["status"];
  isSos?: boolean;
  sosMessage?: string | null;
}

interface OfflineQueueEntry {
  id: string;
  payload: HeadcountUpdate;
  timestamp: number;
}

const TRIPS_QUERY_KEY = ["activeTrips"] as const;
const OFFLINE_QUEUE_KEY = "sgatar_offline_queue";

async function fetchTrips(): Promise<TripWithRoute[]> {
  const res = await fetch("/api/trips", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch trips: ${res.status}`);
  }
  return res.json() as Promise<TripWithRoute[]>;
}

async function patchTrip(update: HeadcountUpdate): Promise<TripWithRoute> {
  const { tripId, ...body } = update;
  const res = await fetch(`/api/trips/${tripId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Failed to update trip: ${res.status}`);
  }
  return res.json() as Promise<TripWithRoute>;
}

/**
 * Polls `/api/trips` every 4 seconds and returns the current list of active
 * trips joined with their route metadata.
 *
 * - `staleTime: 2000` means window-focus refetches pick up fresh data quickly.
 * - `retry: 1` with `retryDelay: 1000` means a single transient failure is
 *   retried after 1 s (instead of the default exponential back-off), so the
 *   "Connection lost" banner clears within ~5 s rather than ~30 s.
 */
export function useActiveTrips() {
  return useQuery<TripWithRoute[]>({
    queryKey: TRIPS_QUERY_KEY,
    queryFn: fetchTrips,
    refetchInterval: 4000,
    staleTime: 2000,
    retry: 1,
    retryDelay: 1000,
  });
}

function getOfflineQueue(): OfflineQueueEntry[] {
  if (globalThis.window === undefined) return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? (JSON.parse(raw) as OfflineQueueEntry[]) : [];
  } catch {
    return [];
  }
}

function setOfflineQueue(queue: OfflineQueueEntry[]): void {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

function addToOfflineQueue(payload: HeadcountUpdate): void {
  const queue = getOfflineQueue();
  queue.push({
    id: crypto.randomUUID(),
    payload,
    timestamp: Date.now(),
  });
  setOfflineQueue(queue);
}

async function syncOfflineQueue(queryClient: QueryClient): Promise<void> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  const remaining: OfflineQueueEntry[] = [];

  for (const entry of queue) {
    try {
      await patchTrip(entry.payload);
    } catch {
      remaining.push(entry);
    }
  }

  setOfflineQueue(remaining);
  await queryClient.invalidateQueries({ queryKey: TRIPS_QUERY_KEY });
}

/**
 * Mutation hook for updating a trip's headcount, status, or SOS flag.
 *
 * Behaviour:
 * - **Online**: PATCHes the server and invalidates the trip cache on settle.
 * - **Offline**: Serialises the update into `localStorage` and throws so the
 *   caller can display an offline indicator.  Updates are replayed in order
 *   when the `online` browser event fires.
 * - **Optimistic UI**: The cache is updated immediately so the LO sees the
 *   change without waiting for the round-trip.  A rollback is applied if the
 *   server returns an error.
 */
export function useUpdateHeadcount() {
  const queryClient = useQueryClient();
  const syncingRef = useRef(false);

  // Sync offline queue when browser comes online
  const handleOnline = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      await syncOfflineQueue(queryClient);
    } finally {
      syncingRef.current = false;
    }
  }, [queryClient]);

  useEffect(() => {
    const onlineHandler = () => {
      void handleOnline();
    };
    globalThis.addEventListener("online", onlineHandler);
    // Attempt sync on mount in case we're already online with queued items
    if (navigator.onLine) {
      void handleOnline();
    }
    return () => globalThis.removeEventListener("online", onlineHandler);
  }, [handleOnline]);

  return useMutation<
    TripWithRoute,
    Error,
    HeadcountUpdate,
    { previousTrips?: TripWithRoute[] }
  >({
    mutationFn: async (update: HeadcountUpdate) => {
      if (!navigator.onLine) {
        addToOfflineQueue(update);
        throw new Error("Offline: queued for sync");
      }
      return patchTrip(update);
    },
    onMutate: async (update: HeadcountUpdate) => {
      await queryClient.cancelQueries({ queryKey: TRIPS_QUERY_KEY });

      const previousTrips =
        queryClient.getQueryData<TripWithRoute[]>(TRIPS_QUERY_KEY);

      // Optimistic update
      queryClient.setQueryData<TripWithRoute[]>(TRIPS_QUERY_KEY, (old) =>
        old?.map((trip: TripWithRoute) =>
          trip.id === update.tripId
            ? {
                ...trip,
                currentPax: update.currentPax,
                ...(update.status !== undefined && { status: update.status }),
                ...(update.isSos !== undefined && { isSos: update.isSos }),
              }
            : trip,
        ),
      );

      return { previousTrips };
    },
    onError: (
      _err: Error,
      _update: HeadcountUpdate,
      context: { previousTrips?: TripWithRoute[] } | undefined,
    ) => {
      // Rollback on error
      if (context?.previousTrips) {
        queryClient.setQueryData(TRIPS_QUERY_KEY, context.previousTrips);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TRIPS_QUERY_KEY }).catch(() => {
        // Will refetch on next interval
      });
    },
  });
}

// ── Delegate fleet hook ───────────────────────────────────────────────────────

/**
 * Returns a delegate-scoped view of the live fleet.
 *
 * Filtering logic (in order of precedence):
 * 1. If `delegateCountry` is `null` or empty, returns every non-completed trip
 *    (unfiltered general view).
 * 2. Otherwise returns trips whose `assignedDelegations` array either:
 *    - **includes** the `delegateCountry` code (personalised service), OR
 *    - is `null` / empty (general pool trip visible to all delegates).
 *
 * The result is a stable memoised derivation of the shared `useActiveTrips`
 * cache — no additional network requests are made.
 *
 * @param delegateCountry - ISO 3166-1 alpha-3 country code selected by the
 *   delegate, or `null` to show all trips.
 * @returns `{ data, isLoading, error }` mirroring the React Query shape.
 */
export function useDelegateFleet(delegateCountry: string | null) {
  const { data: trips, isLoading, error } = useActiveTrips();

  const data = trips?.filter((trip) => {
    if (trip.status === "completed") return false;
    if (!delegateCountry) return true;
    const hasDelegations =
      trip.assignedDelegations && trip.assignedDelegations.length > 0;
    if (!hasDelegations) return true;
    return trip.assignedDelegations?.includes(delegateCountry) ?? false;
  });

  return { data, isLoading, error };
}
