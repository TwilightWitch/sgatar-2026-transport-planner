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
  isAdhoc: boolean;
  conferenceDay: string;
  serviceName: string;
  targetArrival: string;
  pickupLocation: string;
  dropoffLocation: string;
  scheduledDeparture: string;
  scheduledArrival: string;
}

interface HeadcountUpdate {
  tripId: string;
  currentPax: number;
  status?: TripWithRoute["status"];
  isSos?: boolean;
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
    globalThis.addEventListener("online", handleOnline);
    // Attempt sync on mount in case we're already online with queued items
    if (navigator.onLine) {
      handleOnline().catch(() => {
        // Will retry on next online event
      });
    }
    return () => globalThis.removeEventListener("online", handleOnline);
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
