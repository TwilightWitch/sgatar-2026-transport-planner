/**
 * @file Live fleet data hooks.
 *
 * Provides two React Query hooks consumed throughout the app:
 *
 * - {@link useActiveTrips}   — Polls `/api/trips` every 4 s and returns the
 *   full `TripWithRoute[]` list.  All portals share this single cached query.
 *
 * - {@link useUpdateHeadcount} — Mutation hook that PATCHes a single trip.  It
 *   applies an optimistic update immediately, rolls back on error, and queues
 *   changes in `localStorage` when the device is offline so they are replayed
 *   once connectivity is restored.
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

export interface TripWithRoute {
  id: string;
  routeId: string;
  busIdentifier: string;
  maxCapacity: number;
  currentPax: number;
  assignedLoCount: number;
  status: "scheduled" | "boarding" | "en_route" | "delayed" | "completed";
  actualDepartureTime: string | null;
  actualArrivalTime: string | null;
  operationalNote: string | null;
  isSos: boolean;
  sosMessage: string | null;
  isAdhoc: boolean;
  conferenceDay: string;
  serviceName: string;
  targetArrival: string;
  pickupLocation: string;
  dropoffLocation: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  driverName: string | null;
  driverPhone: string | null;
  plateNumber: string | null;
}

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
  const res = await fetch("/api/trips");
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
 * Data is considered stale after 2 s so refetches triggered by window focus or
 * network restore pick up the latest server state promptly.
 */
export function useActiveTrips() {
  return useQuery<TripWithRoute[]>({
    queryKey: TRIPS_QUERY_KEY,
    queryFn: fetchTrips,
    refetchInterval: 4000,
    staleTime: 2000,
    retry: 1,
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
