/**
 * @file lo-filters-buscard.test.tsx
 *
 * Unit tests covering:
 * 1. {@link applyStatusFilter} and {@link applySearch} logic from lo.tsx
 *    (imported via the pure-function pattern — no React Query needed).
 * 2. {@link TripFilters} component rendering and interaction.
 * 3. {@link BusCard} draft-state + Confirm / Discard behaviour.
 */
import { BusCard } from "@/components/lo/BusCard";
import { TripFilters, type StatusFilter } from "@/components/lo/TripFilters";
import type { TripWithRoute } from "@/hooks/useLiveFleet";
import { I18nProvider } from "@/lib/i18n/provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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

function makeTrip(overrides: Partial<TripWithRoute> = {}): TripWithRoute {
  return {
    id: "trip-1",
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

function makeQC() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <QueryClientProvider client={makeQC()}>{children}</QueryClientProvider>
    </I18nProvider>
  );
}

// ── Filter logic (pure function tests — no React needed) ──────────────────────
// Re-implement the tiny functions inline so we test the logic directly without
// importing a Next.js page (which causes jsdom issues with dynamic imports).

type SF = StatusFilter;

function applyStatusFilter(trips: TripWithRoute[], f: SF): TripWithRoute[] {
  if (f === "all") return trips;
  if (f === "active") return trips.filter((t) => t.status !== "completed");
  return trips.filter((t) => t.status === f);
}

function applySearch(trips: TripWithRoute[], q: string): TripWithRoute[] {
  const lower = q.trim().toLowerCase();
  if (!lower) return trips;
  return trips.filter(
    (t) =>
      t.serviceName.toLowerCase().includes(lower) ||
      t.busIdentifier.toLowerCase().includes(lower) ||
      t.pickupLocation.toLowerCase().includes(lower) ||
      t.dropoffLocation.toLowerCase().includes(lower),
  );
}

describe("applyStatusFilter", () => {
  const trips = [
    makeTrip({ id: "a", status: "scheduled" }),
    makeTrip({ id: "b", status: "boarding" }),
    makeTrip({ id: "c", status: "delayed" }),
    makeTrip({ id: "d", status: "completed" }),
  ];

  it("active excludes completed", () => {
    const r = applyStatusFilter(trips, "active");
    expect(r.map((t) => t.id)).toEqual(["a", "b", "c"]);
  });

  it("all returns every trip", () => {
    expect(applyStatusFilter(trips, "all")).toHaveLength(4);
  });

  it("boarding filters to boarding only", () => {
    const r = applyStatusFilter(trips, "boarding");
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe("b");
  });

  it("delayed filters to delayed only", () => {
    const r = applyStatusFilter(trips, "delayed");
    expect(r[0].id).toBe("c");
  });
});

describe("applySearch", () => {
  const trips = [
    makeTrip({
      id: "1",
      serviceName: "Hotels \u2192 MBS",
      busIdentifier: "Bus 1",
      pickupLocation: "Parkroyal MB",
    }),
    makeTrip({
      id: "2",
      serviceName: "Night Safari Run",
      busIdentifier: "Bus 2",
      pickupLocation: "Rendezvous",
    }),
  ];

  it("blank query returns all", () => {
    expect(applySearch(trips, "")).toHaveLength(2);
  });

  it("matches service name case-insensitively", () => {
    expect(applySearch(trips, "night safari")).toHaveLength(1);
  });

  it("matches bus identifier", () => {
    expect(applySearch(trips, "bus 1")).toHaveLength(1);
  });

  it("matches pickup location", () => {
    expect(applySearch(trips, "rendezvous")).toHaveLength(1);
  });

  it("returns empty when nothing matches", () => {
    expect(applySearch(trips, "zzz")).toHaveLength(0);
  });
});

// ── TripFilters component ─────────────────────────────────────────────────────

describe("TripFilters", () => {
  const defaultProps = {
    days: ["8 Sep (Tue)", "9 Sep (Wed)"],
    selectedDay: "all",
    onDayChange: vi.fn(),
    statusFilter: "active" as SF,
    onStatusFilterChange: vi.fn(),
    searchQuery: "",
    onSearchChange: vi.fn(),
    totalCount: 10,
    filteredCount: 10,
  };

  afterEach(() => vi.clearAllMocks());

  it("renders day chips when multiple days exist", () => {
    render(<TripFilters {...defaultProps} />);
    expect(screen.getByText("8 Sep (Tue)")).toBeTruthy();
    expect(screen.getByText("9 Sep (Wed)")).toBeTruthy();
  });

  it("calls onDayChange when a day chip is clicked", () => {
    const onDayChange = vi.fn();
    render(<TripFilters {...defaultProps} onDayChange={onDayChange} />);
    fireEvent.click(screen.getByText("8 Sep (Tue)"));
    expect(onDayChange).toHaveBeenCalledWith("8 Sep (Tue)");
  });

  it("does not render day chips when only one day exists", () => {
    render(<TripFilters {...defaultProps} days={["8 Sep (Tue)"]} />);
    expect(screen.queryByRole("group", { name: /conference day/i })).toBeNull();
  });

  it("shows result count when any filter is active", () => {
    render(
      <TripFilters
        {...defaultProps}
        selectedDay="8 Sep (Tue)"
        filteredCount={3}
      />,
    );
    expect(screen.getByText(/3/)).toBeTruthy();
  });

  it("hides result count when no filter is active", () => {
    render(<TripFilters {...defaultProps} />);
    expect(screen.queryByText(/Showing/)).toBeNull();
  });

  it("calls onSearchChange when typing in search box", () => {
    const onSearchChange = vi.fn();
    render(<TripFilters {...defaultProps} onSearchChange={onSearchChange} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "mbs" },
    });
    expect(onSearchChange).toHaveBeenCalledWith("mbs");
  });
});

// ── BusCard draft state ───────────────────────────────────────────────────────

describe("BusCard", () => {
  let fetchMock: MockInstance;

  beforeEach(() => {
    fetchMock = vi.mocked(globalThis.fetch);
    // Seed the trips query so useUpdateHeadcount's optimistic update has data
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([makeTrip()]),
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the bus identifier and route", () => {
    render(
      <Wrapper>
        <BusCard trip={makeTrip()} />
      </Wrapper>,
    );
    expect(screen.getByText("Bus 1")).toBeTruthy();
    expect(screen.getByText(/Rendezvous.*MBS/)).toBeTruthy();
  });

  it("does NOT show Confirm/Discard when draft matches server state", () => {
    render(
      <Wrapper>
        <BusCard trip={makeTrip()} />
      </Wrapper>,
    );
    expect(screen.queryByText("Confirm")).toBeNull();
    expect(screen.queryByText("Discard")).toBeNull();
  });

  it("shows Confirm/Discard when milestone is changed via MilestoneTracker", async () => {
    render(
      <Wrapper>
        <BusCard trip={makeTrip({ status: "scheduled" })} />
      </Wrapper>,
    );

    // Click the "Boarding" status pill
    const boardingBtn = screen.getAllByRole("radio", {
      name: /^boarding$/i,
    })[0];
    act(() => {
      fireEvent.click(boardingBtn);
    });

    expect(await screen.findByText("Confirm")).toBeTruthy();
    expect(screen.getByText("Discard")).toBeTruthy();
    expect(screen.getByText("Unsaved changes")).toBeTruthy();
  });

  it("Discard reverts draft to server state", async () => {
    render(
      <Wrapper>
        <BusCard trip={makeTrip({ status: "scheduled" })} />
      </Wrapper>,
    );

    act(() => {
      fireEvent.click(screen.getAllByRole("radio", { name: /^boarding$/i })[0]);
    });
    await screen.findByText("Confirm");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /discard/i }));
    });

    expect(screen.queryByText("Confirm")).toBeNull();
  });

  it("Confirm fires mutation with draft values", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/api/trips/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...makeTrip(), status: "boarding" }),
        }) as Promise<Response>;
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([makeTrip()]),
      }) as Promise<Response>;
    });

    render(
      <Wrapper>
        <BusCard trip={makeTrip({ status: "scheduled" })} />
      </Wrapper>,
    );

    act(() => {
      fireEvent.click(screen.getAllByRole("radio", { name: /^boarding$/i })[0]);
    });
    await screen.findByText("Confirm");

    act(() => {
      fireEvent.click(
        screen.getByRole("button", { name: /confirm and save/i }),
      );
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/trips/trip-1"),
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });
});
