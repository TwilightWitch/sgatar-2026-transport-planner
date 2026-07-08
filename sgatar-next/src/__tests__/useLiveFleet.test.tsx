/**
 * @file Unit tests for useLiveFleet hooks.
 *
 * Covers:
 * 1. `useDelegateFleet` — filtering logic for personalised and general-pool trips.
 * 2. `useUpdateHeadcount` — optimistic UI rollback when the server mutation fails.
 *
 * These tests use React Testing Library + React Query wrappers and mock `fetch`
 * via vitest's `vi.fn()` (configured globally in setup.ts).
 */
import { PersonalizedFleet } from "@/components/delegate/PersonalizedFleet";
import {
  useActiveTrips,
  useDelegateFleet,
  useDeleteTrip,
  useUpdateHeadcount,
  type TripWithRoute,
} from "@/hooks/useLiveFleet";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Builds a minimal `TripWithRoute` for tests. */
function makeTrip(overrides: Partial<TripWithRoute> = {}): TripWithRoute {
  return {
    id: crypto.randomUUID(),
    routeId: "route-1",
    busIdentifier: "Bus 1",
    maxCapacity: 40,
    currentPax: 10,
    assignedLoCount: 1,
    status: "scheduled",
    actualDepartureTime: null,
    actualArrivalTime: null,
    operationalNote: null,
    isSos: false,
    sosMessage: null,
    isAdhoc: false,
    driverName: null,
    driverPhone: null,
    loName: null,
    loPhone: null,
    plateNumber: null,
    assignedDelegations: null,
    conferenceDay: "8 Sep (Tue)",
    serviceName: "Hotels → MBS",
    targetArrival: "08:45",
    pickupLocation: "Rendezvous",
    dropoffLocation: "MBS",
    scheduledDeparture: "08:00",
    scheduledArrival: "08:20",
    routeType: "shuttle",
    flightNumber: null,
    terminal: null,
    pickupInstructions: null,
    ...overrides,
  };
}

/**
 * Creates an isolated QueryClient per test to prevent cache leaking between
 * test cases.  Retries and background refetches are disabled to keep tests fast.
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchInterval: false },
      mutations: { retry: false },
    },
  });
}

/** Wrapper component supplying React Query context to rendered hooks. */
function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

// ── useDelegateFleet ──────────────────────────────────────────────────────────

describe("useDelegateFleet", () => {
  let queryClient: QueryClient;
  let fetchMock: MockInstance;

  const TRIP_GENERAL = makeTrip({
    id: "trip-general",
    assignedDelegations: null,
  });
  const TRIP_SGP = makeTrip({
    id: "trip-sgp",
    assignedDelegations: ["SGP"],
  });
  const TRIP_AUS = makeTrip({
    id: "trip-aus",
    assignedDelegations: ["AUS"],
  });
  const TRIP_MULTI = makeTrip({
    id: "trip-multi",
    assignedDelegations: ["SGP", "MYS"],
  });
  const TRIP_COMPLETED = makeTrip({
    id: "trip-done",
    status: "completed",
    assignedDelegations: null,
  });

  const ALL_TRIPS: TripWithRoute[] = [
    TRIP_GENERAL,
    TRIP_SGP,
    TRIP_AUS,
    TRIP_MULTI,
    TRIP_COMPLETED,
  ];

  beforeEach(() => {
    queryClient = createTestQueryClient();
    fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(ALL_TRIPS),
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("returns all non-completed trips when delegateCountry is null", async () => {
    const { result } = renderHook(() => useDelegateFleet(null), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const ids = result.current.data?.map((t) => t.id);
    expect(ids).toContain("trip-general");
    expect(ids).toContain("trip-sgp");
    expect(ids).toContain("trip-aus");
    expect(ids).toContain("trip-multi");
    // completed trip must be excluded
    expect(ids).not.toContain("trip-done");
  });

  it("returns general-pool trips + country-matched trips for a given country", async () => {
    const { result } = renderHook(() => useDelegateFleet("SGP"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const ids = result.current.data?.map((t) => t.id);
    // General pool (null delegations) is always included
    expect(ids).toContain("trip-general");
    // SGP is in assignedDelegations
    expect(ids).toContain("trip-sgp");
    // Multi-delegation trip includes SGP
    expect(ids).toContain("trip-multi");
    // AUS-only trip must be excluded for SGP delegate
    expect(ids).not.toContain("trip-aus");
    // Completed trips must be excluded regardless
    expect(ids).not.toContain("trip-done");
  });

  it("excludes country-specific trips that do not include the selected country", async () => {
    const { result } = renderHook(() => useDelegateFleet("AUS"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const ids = result.current.data?.map((t) => t.id);
    expect(ids).toContain("trip-aus");
    // SGP-only trip must not appear for AUS delegate
    expect(ids).not.toContain("trip-sgp");
  });

  it("treats an empty assignedDelegations array as general pool", async () => {
    const emptyPool = makeTrip({ id: "trip-empty", assignedDelegations: [] });
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([emptyPool]),
    });

    const { result } = renderHook(() => useDelegateFleet("SGP"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const ids = result.current.data?.map((t) => t.id);
    // Empty array trip should be visible to any delegation (general pool)
    expect(ids).toContain("trip-empty");
  });

  it("reflects a loading state before the query resolves", () => {
    // Never resolve to simulate pending state
    fetchMock.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useDelegateFleet("SGP"), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("returns error state when fetch fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    const { result } = renderHook(() => useDelegateFleet("SGP"), {
      wrapper: createWrapper(queryClient),
    });

    // Wait for error to appear (query may retry once, so allow extra time)
    await waitFor(() => expect(result.current.error).toBeTruthy(), {
      timeout: 5000,
    });
  });
});

describe("useActiveTrips sorting", () => {
  it("sorts by scheduledDeparture then busIdentifier", async () => {
    const queryClient = createTestQueryClient();

    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          makeTrip({
            id: "3",
            scheduledDeparture: "09:00",
            busIdentifier: "Bus C",
          }),
          makeTrip({
            id: "2",
            scheduledDeparture: "08:00",
            busIdentifier: "Bus B",
          }),
          makeTrip({
            id: "1",
            scheduledDeparture: "08:00",
            busIdentifier: "Bus A",
          }),
        ]),
    } as Response);

    const { result } = renderHook(() => useActiveTrips(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const orderedIds = result.current.data?.map((trip) => trip.id);
    expect(orderedIds).toEqual(["1", "2", "3"]);
  });
});

// ── useUpdateHeadcount — optimistic UI rollback ───────────────────────────────

describe("useUpdateHeadcount optimistic rollback", () => {
  let queryClient: QueryClient;
  let fetchMock: MockInstance;

  const INITIAL_TRIP = makeTrip({ id: "trip-1", currentPax: 10 });

  beforeEach(() => {
    queryClient = createTestQueryClient();
    fetchMock = vi.mocked(globalThis.fetch);

    // Seed the query cache with an initial trips list so onMutate has data to roll back
    queryClient.setQueryData(["activeTrips"], [INITIAL_TRIP]);

    // First fetch (for poll) returns the initial state
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([INITIAL_TRIP]),
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("applies optimistic update immediately before server responds", async () => {
    // Delay the PATCH response so we can inspect intermediate state
    let resolvePatch!: () => void;
    const pendingPatch = new Promise<void>((r) => {
      resolvePatch = r;
    });

    fetchMock.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/api/trips/")) {
        return pendingPatch.then(() => ({
          ok: true,
          json: () => Promise.resolve({ ...INITIAL_TRIP, currentPax: 25 }),
        })) as Promise<Response>;
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([INITIAL_TRIP]),
      }) as Promise<Response>;
    });

    const { result } = renderHook(() => useUpdateHeadcount(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        tripId: "trip-1",
        currentPax: 25,
        status: "boarding",
      });
    });

    // Cache should immediately reflect the optimistic value
    await waitFor(() => {
      const cached = queryClient.getQueryData<TripWithRoute[]>(["activeTrips"]);
      expect(cached?.[0]?.currentPax).toBe(25);
    });

    resolvePatch();
  });

  it("rolls back optimistic update when PATCH returns an error", async () => {
    // PATCH fails
    fetchMock.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/api/trips/")) {
        return Promise.resolve({ ok: false, status: 500 }) as Promise<Response>;
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([INITIAL_TRIP]),
      }) as Promise<Response>;
    });

    const { result } = renderHook(() => useUpdateHeadcount(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ tripId: "trip-1", currentPax: 99 });
    });

    // After the error resolves, the cache must be restored to the original value
    await waitFor(() => {
      const cached = queryClient.getQueryData<TripWithRoute[]>(["activeTrips"]);
      expect(cached?.[0]?.currentPax).toBe(10);
    });
  });

  it("accepts departed_origin and arrived_destination status values", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/api/trips/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ...INITIAL_TRIP,
              status: "departed_origin",
              currentPax: 10,
            }),
        }) as Promise<Response>;
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([INITIAL_TRIP]),
      }) as Promise<Response>;
    });

    const { result } = renderHook(() => useUpdateHeadcount(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        tripId: "trip-1",
        currentPax: 10,
        status: "departed_origin",
      });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<TripWithRoute[]>(["activeTrips"]);
      expect(cached?.[0]?.status).toBe("departed_origin");
    });
  });
});

describe("useDeleteTrip optimistic removal", () => {
  it("removes a trip from cache before server response", async () => {
    const queryClient = createTestQueryClient();
    const fetchMock = vi.mocked(globalThis.fetch);

    queryClient.setQueryData(
      ["activeTrips"],
      [makeTrip({ id: "trip-1" }), makeTrip({ id: "trip-2" })],
    );

    let resolveDelete!: () => void;
    const pendingDelete = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });

    fetchMock.mockImplementation(
      (input: RequestInfo | URL, init?: RequestInit) => {
        let url: string;
        if (typeof input === "string") {
          url = input;
        } else if (input instanceof URL) {
          url = input.href;
        } else {
          url = input.url;
        }
        if (url.includes("/api/trips/trip-1") && init?.method === "DELETE") {
          return pendingDelete.then(
            () =>
              ({
                ok: true,
                json: () => Promise.resolve({ success: true }),
              }) as Response,
          );
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([makeTrip({ id: "trip-2" })]),
        } as Response);
      },
    );

    const { result } = renderHook(() => useDeleteTrip(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate("trip-1");
    });

    await waitFor(() => {
      const cachedTrips = queryClient.getQueryData<TripWithRoute[]>([
        "activeTrips",
      ]);
      const ids = cachedTrips?.map((trip) => trip.id);
      expect(ids).toEqual(["trip-2"]);
    });

    resolveDelete();
  });
});

// ── PersonalizedFleet component smoke test ────────────────────────────────────

describe("PersonalizedFleet renders without crashing", () => {
  it("mounts and shows the country selector", async () => {
    const qc = createTestQueryClient();
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    // Ensure localStorage is available in jsdom
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    const { getByLabelText } = await import("@testing-library/react").then(
      (m) => m,
    );

    const { render } = await import("@testing-library/react");

    const { unmount } = render(
      <QueryClientProvider client={qc}>
        <PersonalizedFleet />
      </QueryClientProvider>,
    );

    // Country selector must be accessible
    expect(getByLabelText(document.body, /delegation/i)).toBeTruthy();

    unmount();
    qc.clear();
  });
});
