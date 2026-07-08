/**
 * @file Tests for App Router master route endpoints.
 *
 * Covers POST/PATCH/DELETE happy-path and validation/failure responses.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

interface MasterRouteRecord {
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

interface DbRouteMocks {
  orderBy: ReturnType<typeof vi.fn>;
  insertReturning: ReturnType<typeof vi.fn>;
  updateReturning: ReturnType<typeof vi.fn>;
  deleteReturning: ReturnType<typeof vi.fn>;
}

function createRouteRecord(
  overrides: Partial<MasterRouteRecord> = {},
): MasterRouteRecord {
  return {
    id: "route-1",
    conferenceDay: "8 Sep (Tue)",
    serviceName: "Hotels to MBS",
    targetArrival: "08:45",
    pickupLocation: "Rendezvous",
    dropoffLocation: "MBS",
    scheduledDeparture: "08:00",
    scheduledArrival: "08:20",
    defaultCapacity: 40,
    routeType: "shuttle",
    flightNumber: null,
    terminal: null,
    pickupInstructions: null,
    ...overrides,
  };
}

function setupDbMocks() {
  const orderBy = vi.fn();
  const from = vi.fn(() => ({ orderBy }));

  const insertReturning = vi.fn();
  const insertValues = vi.fn(() => ({ returning: insertReturning }));

  const updateReturning = vi.fn();
  const updateWhere = vi.fn(() => ({ returning: updateReturning }));
  const updateSet = vi.fn(() => ({ where: updateWhere }));

  const deleteReturning = vi.fn();
  const deleteWhere = vi.fn(() => ({ returning: deleteReturning }));

  const db = {
    select: vi.fn(() => ({ from })),
    insert: vi.fn(() => ({ values: insertValues })),
    update: vi.fn(() => ({ set: updateSet })),
    delete: vi.fn(() => ({ where: deleteWhere })),
  };

  const routeTable = {
    id: "id",
    conferenceDay: "conferenceDay",
    serviceName: "serviceName",
    targetArrival: "targetArrival",
    pickupLocation: "pickupLocation",
    dropoffLocation: "dropoffLocation",
    scheduledDeparture: "scheduledDeparture",
    scheduledArrival: "scheduledArrival",
    defaultCapacity: "defaultCapacity",
    routeType: "routeType",
    flightNumber: "flightNumber",
    terminal: "terminal",
    pickupInstructions: "pickupInstructions",
  };

  const mocks: DbRouteMocks = {
    orderBy,
    insertReturning,
    updateReturning,
    deleteReturning,
  };

  return { db, routeTable, mocks };
}

async function importCollectionRouteHandlers(
  mockedDb: ReturnType<typeof setupDbMocks>,
) {
  vi.resetModules();

  vi.doMock("@/db", () => ({ db: mockedDb.db }));
  vi.doMock("@/db/schema", () => ({ routes: mockedDb.routeTable }));
  vi.doMock("drizzle-orm", () => ({
    asc: vi.fn((value: unknown) => value),
    eq: vi.fn((left: unknown, right: unknown) => ({ left, right })),
  }));

  return import("@/app/api/routes/route");
}

async function importItemRouteHandlers(
  mockedDb: ReturnType<typeof setupDbMocks>,
) {
  vi.resetModules();

  vi.doMock("@/db", () => ({ db: mockedDb.db }));
  vi.doMock("@/db/schema", () => ({ routes: mockedDb.routeTable }));
  vi.doMock("drizzle-orm", () => ({
    asc: vi.fn((value: unknown) => value),
    eq: vi.fn((left: unknown, right: unknown) => ({ left, right })),
  }));

  return import("@/app/api/routes/[id]/route");
}

describe("App Router /api/routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST creates a route and returns 201", async () => {
    const mockedDb = setupDbMocks();
    const createdRoute = createRouteRecord({ id: "route-created" });
    mockedDb.mocks.insertReturning.mockResolvedValue([createdRoute]);

    const handlers = await importCollectionRouteHandlers(mockedDb);

    const request = new Request("http://localhost/api/routes", {
      method: "POST",
      body: JSON.stringify({
        conferenceDay: "9 Sep (Wed)",
        serviceName: "MBS to Hotels",
        targetArrival: "19:00",
        pickupLocation: "MBS",
        dropoffLocation: "Rendezvous",
        scheduledDeparture: "18:30",
        scheduledArrival: "18:50",
        defaultCapacity: 45,
        routeType: "shuttle",
        flightNumber: null,
        terminal: null,
        pickupInstructions: "Main lobby",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await handlers.POST(request);
    const body = (await response.json()) as MasterRouteRecord;

    expect(response.status).toBe(201);
    expect(body.id).toBe("route-created");
    expect(body.serviceName).toBe("Hotels to MBS");
  });

  it("POST returns 400 for invalid payload", async () => {
    const mockedDb = setupDbMocks();
    const handlers = await importCollectionRouteHandlers(mockedDb);

    const request = new Request("http://localhost/api/routes", {
      method: "POST",
      body: JSON.stringify({
        conferenceDay: "",
        serviceName: "",
        targetArrival: "",
        pickupLocation: "",
        dropoffLocation: "",
        scheduledDeparture: "",
        scheduledArrival: "",
        defaultCapacity: 0,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await handlers.POST(request);

    expect(response.status).toBe(400);
  });
});

describe("App Router /api/routes/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("PATCH updates a route and returns 200", async () => {
    const mockedDb = setupDbMocks();
    const updatedRoute = createRouteRecord({ serviceName: "Updated Service" });
    mockedDb.mocks.updateReturning.mockResolvedValue([updatedRoute]);

    const handlers = await importItemRouteHandlers(mockedDb);

    const request = new Request("http://localhost/api/routes/route-1", {
      method: "PATCH",
      body: JSON.stringify({ serviceName: "Updated Service" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await handlers.PATCH(request, {
      params: Promise.resolve({ id: "route-1" }),
    });

    const body = (await response.json()) as MasterRouteRecord;
    expect(response.status).toBe(200);
    expect(body.serviceName).toBe("Updated Service");
  });

  it("PATCH returns 400 when no patch fields are provided", async () => {
    const mockedDb = setupDbMocks();
    const handlers = await importItemRouteHandlers(mockedDb);

    const request = new Request("http://localhost/api/routes/route-1", {
      method: "PATCH",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const response = await handlers.PATCH(request, {
      params: Promise.resolve({ id: "route-1" }),
    });

    expect(response.status).toBe(400);
  });

  it("PATCH returns 404 when route does not exist", async () => {
    const mockedDb = setupDbMocks();
    mockedDb.mocks.updateReturning.mockResolvedValue([]);
    const handlers = await importItemRouteHandlers(mockedDb);

    const request = new Request("http://localhost/api/routes/missing", {
      method: "PATCH",
      body: JSON.stringify({ serviceName: "No Route" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await handlers.PATCH(request, {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(404);
  });

  it("DELETE removes a route and returns 200", async () => {
    const mockedDb = setupDbMocks();
    mockedDb.mocks.deleteReturning.mockResolvedValue([{ id: "route-1" }]);
    const handlers = await importItemRouteHandlers(mockedDb);

    const response = await handlers.DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: "route-1" }),
    });

    const body = (await response.json()) as { success: boolean };
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("DELETE returns 404 when route does not exist", async () => {
    const mockedDb = setupDbMocks();
    mockedDb.mocks.deleteReturning.mockResolvedValue([]);
    const handlers = await importItemRouteHandlers(mockedDb);

    const response = await handlers.DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(404);
  });
});
