/**
 * @file Live fleet and master route data hooks.
 *
 * This module centralizes React Query contracts used by the LO, delegate,
 * display, and admin portals:
 * - `useActiveTrips` with deterministic cache ordering to prevent row flicker.
 * - `useDayFilteredFleet` and `useDelegateFleet` derived selectors.
 * - `useUpdateHeadcount` and `useDeleteTrip` optimistic trip mutations.
 * - `useRoutes` plus `useCreateRoute` / `useUpdateRoute` / `useDeleteRoute`
 *   for master schedule administration.
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
 * Canonical data contract between `/api/trips` and all UI components.
 */
export interface TripWithRoute {
  id: string;
  routeId: string;
  busIdentifier: string;
  maxCapacity: number;
  currentPax: number;
  assignedLoCount: number;
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
  delegateNotice: string | null;
  isSos: boolean;
  sosMessage: string | null;
  isAdhoc: boolean;
  driverName: string | null;
  driverPhone: string | null;
  loName: string | null;
  loPhone: string | null;
  plateNumber: string | null;
  assignedDelegations: string[] | null;
  conferenceDay: string;
  serviceName: string;
  targetArrival: string;
  pickupLocation: string;
  dropoffLocation: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  routeType: "shuttle" | "airport_arrival" | "airport_departure" | null;
  flightNumber: string | null;
  terminal: string | null;
  pickupInstructions: string | null;
}

/** Payload sent to `PATCH /api/trips/[id]`. */
export interface HeadcountUpdate {
  tripId: string;
  currentPax: number;
  status?: TripWithRoute["status"];
  isSos?: boolean;
  sosMessage?: string | null;
  operationalNote?: string | null;
  delegateNotice?: string | null;
  loName?: string | null;
  loPhone?: string | null;
}

/** Master schedule route returned by `/api/routes`. */
export interface MasterRoute {
  id: string;
  conferenceDay: string;
  serviceName: string;
  targetArrival: string;
  pickupLocation: string;
  dropoffLocation: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  defaultCapacity: number;
  routeType: string | null;
  flightNumber: string | null;
  terminal: string | null;
  pickupInstructions: string | null;
}

/** Input shape accepted by create/update master route APIs. */
export interface MasterRouteInput {
  conferenceDay: string;
  serviceName: string;
  targetArrival: string;
  pickupLocation: string;
  dropoffLocation: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  defaultCapacity: number;
  routeType?: string | null;
  flightNumber?: string | null;
  terminal?: string | null;
  pickupInstructions?: string | null;
}

interface OfflineQueueEntry {
  id: string;
  payload: HeadcountUpdate;
  timestamp: number;
}

const TRIPS_QUERY_KEY = ["activeTrips"] as const;
const ROUTES_QUERY_KEY = ["masterRoutes"] as const;
const OFFLINE_QUEUE_KEY = "sgatar_offline_queue";
const FINISHED_VISIBILITY_WINDOW_MINUTES = 90;

const ACTIVE_OPERATIONAL_STATUSES: ReadonlySet<TripWithRoute["status"]> =
  new Set(["boarding", "departed_origin", "en_route", "delayed"]);

const FINISHED_STATUSES: ReadonlySet<TripWithRoute["status"]> = new Set([
  "arrived_destination",
  "completed",
]);

function parseHmToMinutes(hm: string): number {
  const timeParts = hm.split(":");
  if (timeParts.length < 2) {
    return Number.POSITIVE_INFINITY;
  }

  const hours = Number.parseInt(timeParts[0], 10);
  const minutes = Number.parseInt(timeParts[1], 10);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return Number.POSITIVE_INFINITY;
  }

  return hours * 60 + minutes;
}

function getLiveSortGroup(trip: TripWithRoute): number {
  if (trip.isSos) return 1;
  if (ACTIVE_OPERATIONAL_STATUSES.has(trip.status)) return 2;
  if (trip.status === "scheduled") return 3;
  if (FINISHED_STATUSES.has(trip.status)) return 4;
  return 5;
}

/**
 * Produces a single live-ops ordering used across LO, delegate, and FIDS views.
 *
 * Why this order exists:
 * 1. SOS trips always stay at the very top so incidents are never buried.
 * 2. Active operations (boarding/departed/en-route/delayed) come next.
 * 3. Scheduled upcoming trips follow in chronological order.
 * 4. Finished trips are intentionally pushed to the bottom to reduce noise
 *    without deleting still-relevant records.
 */
export function sortTripsDeterministically(
  trips: readonly TripWithRoute[],
): TripWithRoute[] {
  return [...trips].sort((left, right) => {
    const byGroup = getLiveSortGroup(left) - getLiveSortGroup(right);
    if (byGroup !== 0) return byGroup;

    const byDeparture =
      parseHmToMinutes(left.scheduledDeparture) -
      parseHmToMinutes(right.scheduledDeparture);
    if (byDeparture !== 0) return byDeparture;

    const byBus = left.busIdentifier.localeCompare(right.busIdentifier);
    if (byBus !== 0) return byBus;

    return left.id.localeCompare(right.id);
  });
}

/**
 * Keeps recently finished trips briefly visible on FIDS so users can confirm
 * arrivals, while hiding stale finished rows that crowd active operations.
 */
export function shouldHideTripFromLiveDisplay(
  trip: TripWithRoute,
  now: Date = new Date(),
  thresholdMinutes: number = FINISHED_VISIBILITY_WINDOW_MINUTES,
): boolean {
  if (!FINISHED_STATUSES.has(trip.status)) return false;

  const scheduledMinutes = parseHmToMinutes(trip.scheduledArrival);
  if (!Number.isFinite(scheduledMinutes)) {
    return false;
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes - scheduledMinutes > thresholdMinutes;
}

async function fetchTrips(): Promise<TripWithRoute[]> {
  const response = await fetch("/api/trips", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch trips: ${response.status}`);
  }
  return response.json() as Promise<TripWithRoute[]>;
}

async function patchTrip(update: HeadcountUpdate): Promise<TripWithRoute> {
  const { tripId, ...body } = update;
  const response = await fetch(`/api/trips/${tripId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Failed to update trip: ${response.status}`);
  }
  return response.json() as Promise<TripWithRoute>;
}

async function deleteTripById(tripId: string): Promise<void> {
  const response = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`Failed to delete trip: ${response.status}`);
  }
}

/**
 * Polls `/api/trips` every 4 seconds and returns deterministically sorted data.
 */
export function useActiveTrips() {
  return useQuery<TripWithRoute[]>({
    queryKey: TRIPS_QUERY_KEY,
    queryFn: fetchTrips,
    select: (trips) => sortTripsDeterministically(trips),
    refetchInterval: 4000,
    staleTime: 2000,
    retry: 1,
    retryDelay: 1000,
  });
}

/**
 * Returns a day-filtered view of the shared active fleet query.
 */
export function useDayFilteredFleet(selectedDay: string | null) {
  const { data: trips, isLoading, error } = useActiveTrips();

  const normalizedSelectedDay = selectedDay ?? "";
  const data =
    normalizedSelectedDay.length === 0
      ? trips
      : trips?.filter((trip) => trip.conferenceDay === normalizedSelectedDay);

  const availableDays = [
    ...new Set((trips ?? []).map((trip) => trip.conferenceDay)),
  ];

  return { data, availableDays, isLoading, error };
}

function getOfflineQueue(): OfflineQueueEntry[] {
  if (!("window" in globalThis)) return [];
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
 * Optimistic mutation hook for headcount/status/SOS/LO updates.
 */
export function useUpdateHeadcount() {
  const queryClient = useQueryClient();
  const syncingRef = useRef(false);

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

      queryClient.setQueryData<TripWithRoute[]>(TRIPS_QUERY_KEY, (oldTrips) =>
        oldTrips?.map((trip) =>
          trip.id === update.tripId
            ? {
                ...trip,
                currentPax: update.currentPax,
                ...(update.status !== undefined && { status: update.status }),
                ...(update.isSos !== undefined && { isSos: update.isSos }),
                ...(update.sosMessage !== undefined && {
                  sosMessage: update.sosMessage,
                }),
                ...(update.operationalNote !== undefined && {
                  operationalNote: update.operationalNote,
                }),
                ...(update.delegateNotice !== undefined && {
                  delegateNotice: update.delegateNotice,
                }),
                ...(update.loName !== undefined && { loName: update.loName }),
                ...(update.loPhone !== undefined && {
                  loPhone: update.loPhone,
                }),
              }
            : trip,
        ),
      );

      return { previousTrips };
    },
    onError: (_error, _update, context) => {
      if (context?.previousTrips) {
        queryClient.setQueryData(TRIPS_QUERY_KEY, context.previousTrips);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TRIPS_QUERY_KEY }).catch(() => {
        // Polling query retries automatically.
      });
    },
  });
}

/**
 * Removes an active trip with optimistic cache removal.
 */
export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previousTrips?: TripWithRoute[] }>({
    mutationFn: (tripId: string) => deleteTripById(tripId),
    onMutate: async (tripId: string) => {
      await queryClient.cancelQueries({ queryKey: TRIPS_QUERY_KEY });

      const previousTrips =
        queryClient.getQueryData<TripWithRoute[]>(TRIPS_QUERY_KEY);

      queryClient.setQueryData<TripWithRoute[]>(TRIPS_QUERY_KEY, (oldTrips) =>
        oldTrips?.filter((trip) => trip.id !== tripId),
      );

      return { previousTrips };
    },
    onError: (_error, _tripId, context) => {
      if (context?.previousTrips) {
        queryClient.setQueryData(TRIPS_QUERY_KEY, context.previousTrips);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TRIPS_QUERY_KEY }).catch(() => {
        // Polling query retries automatically.
      });
    },
  });
}

/**
 * Returns delegate-scoped fleet data.
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

async function fetchRoutes(): Promise<MasterRoute[]> {
  const response = await fetch("/api/routes", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch routes: ${response.status}`);
  }
  return response.json() as Promise<MasterRoute[]>;
}

async function createRoute(payload: MasterRouteInput): Promise<MasterRoute> {
  const response = await fetch("/api/routes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to create route: ${response.status}`);
  }

  return response.json() as Promise<MasterRoute>;
}

async function updateRoute(
  payload: { id: string } & Partial<MasterRouteInput>,
): Promise<MasterRoute> {
  const { id, ...patch } = payload;

  const response = await fetch(`/api/routes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    throw new Error(`Failed to update route: ${response.status}`);
  }

  return response.json() as Promise<MasterRoute>;
}

async function deleteRouteById(id: string): Promise<void> {
  const response = await fetch(`/api/routes/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`Failed to delete route: ${response.status}`);
  }
}

/** Fetches all master routes for schedule administration. */
export function useRoutes() {
  return useQuery<MasterRoute[]>({
    queryKey: ROUTES_QUERY_KEY,
    queryFn: fetchRoutes,
    staleTime: 5000,
  });
}

/** Creates a master route with optimistic cache insertion. */
export function useCreateRoute() {
  const queryClient = useQueryClient();

  return useMutation<
    MasterRoute,
    Error,
    MasterRouteInput,
    { previousRoutes?: MasterRoute[]; temporaryId: string }
  >({
    mutationFn: (payload) => createRoute(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ROUTES_QUERY_KEY });
      const previousRoutes =
        queryClient.getQueryData<MasterRoute[]>(ROUTES_QUERY_KEY);

      const temporaryId = `temp-route-${crypto.randomUUID()}`;
      const optimisticRoute: MasterRoute = {
        id: temporaryId,
        conferenceDay: payload.conferenceDay,
        serviceName: payload.serviceName,
        targetArrival: payload.targetArrival,
        pickupLocation: payload.pickupLocation,
        dropoffLocation: payload.dropoffLocation,
        scheduledDeparture: payload.scheduledDeparture,
        scheduledArrival: payload.scheduledArrival,
        defaultCapacity: payload.defaultCapacity,
        routeType: payload.routeType ?? "shuttle",
        flightNumber: payload.flightNumber ?? null,
        terminal: payload.terminal ?? null,
        pickupInstructions: payload.pickupInstructions ?? null,
      };

      queryClient.setQueryData<MasterRoute[]>(ROUTES_QUERY_KEY, (oldRoutes) => [
        ...(oldRoutes ?? []),
        optimisticRoute,
      ]);

      return { previousRoutes, temporaryId };
    },
    onError: (_error, _payload, context) => {
      if (context?.previousRoutes) {
        queryClient.setQueryData(ROUTES_QUERY_KEY, context.previousRoutes);
      }
    },
    onSuccess: (createdRoute, _payload, onMutateResult) => {
      queryClient.setQueryData<MasterRoute[]>(ROUTES_QUERY_KEY, (oldRoutes) =>
        (oldRoutes ?? []).map((route) =>
          route.id === onMutateResult.temporaryId ? createdRoute : route,
        ),
      );
    },
    onSettled: () => {
      queryClient
        .invalidateQueries({ queryKey: ROUTES_QUERY_KEY })
        .catch(() => {
          // Query will refresh automatically.
        });
    },
  });
}

/** Updates a master route with optimistic cache replacement. */
export function useUpdateRoute() {
  const queryClient = useQueryClient();

  return useMutation<
    MasterRoute,
    Error,
    { id: string } & Partial<MasterRouteInput>,
    { previousRoutes?: MasterRoute[] }
  >({
    mutationFn: (payload) => updateRoute(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ROUTES_QUERY_KEY });
      const previousRoutes =
        queryClient.getQueryData<MasterRoute[]>(ROUTES_QUERY_KEY);

      queryClient.setQueryData<MasterRoute[]>(ROUTES_QUERY_KEY, (oldRoutes) =>
        (oldRoutes ?? []).map((route) =>
          route.id === payload.id ? { ...route, ...payload } : route,
        ),
      );

      return { previousRoutes };
    },
    onError: (_error, _payload, context) => {
      if (context?.previousRoutes) {
        queryClient.setQueryData(ROUTES_QUERY_KEY, context.previousRoutes);
      }
    },
    onSettled: () => {
      queryClient
        .invalidateQueries({ queryKey: ROUTES_QUERY_KEY })
        .catch(() => {
          // Query will refresh automatically.
        });
    },
  });
}

/** Deletes a master route with optimistic cache removal. */
export function useDeleteRoute() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previousRoutes?: MasterRoute[] }>({
    mutationFn: (id) => deleteRouteById(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ROUTES_QUERY_KEY });
      const previousRoutes =
        queryClient.getQueryData<MasterRoute[]>(ROUTES_QUERY_KEY);

      queryClient.setQueryData<MasterRoute[]>(ROUTES_QUERY_KEY, (oldRoutes) =>
        (oldRoutes ?? []).filter((route) => route.id !== id),
      );

      return { previousRoutes };
    },
    onError: (_error, _id, context) => {
      if (context?.previousRoutes) {
        queryClient.setQueryData(ROUTES_QUERY_KEY, context.previousRoutes);
      }
    },
    onSettled: () => {
      queryClient
        .invalidateQueries({ queryKey: ROUTES_QUERY_KEY })
        .catch(() => {
          // Query will refresh automatically.
        });
    },
  });
}
