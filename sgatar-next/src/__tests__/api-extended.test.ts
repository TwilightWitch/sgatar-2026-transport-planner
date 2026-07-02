import { getTrips, resetTrips, updateTrip } from "@/lib/tripStore";
import idHandler from "@/pages/api/trips/[id]";
import handler from "@/pages/api/trips/bulk-delay";
import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({
  db: { select: vi.fn(), update: vi.fn(), insert: vi.fn() },
}));

function makeReq(
  method: string,
  body: Record<string, unknown>,
  query: Record<string, string> = {},
): NextApiRequest {
  return {
    method,
    body,
    query,
    headers: {},
    cookies: {},
  } as unknown as NextApiRequest;
}

function makeRes() {
  const r = {
    _status: 200,
    _data: null as unknown,
    status(c: number) {
      r._status = c;
      return r;
    },
    json(d: unknown) {
      r._data = d;
      return r;
    },
    end() {
      return r;
    },
    setHeader() {
      return r;
    },
  };
  return r as unknown as NextApiResponse & { _status: number; _data: unknown };
}

describe("POST /api/trips/bulk-delay (full paths)", () => {
  beforeEach(() => {
    resetTrips();
  });

  it("correctly shifts time by 15 minutes", async () => {
    const trips = getTrips();
    const routeId = trips[0].routeId;
    const originalDep = trips[0].scheduledDeparture;
    const res = makeRes();
    await handler(makeReq("POST", { routeId, delayMinutes: 15 }), res);
    expect(res._status).toBe(200);
    const updated = getTrips().find((t) => t.id === trips[0].id);
    expect(updated?.status).toBe("delayed");
    if (originalDep.includes(":")) {
      const [h, m] = originalDep.split(":").map(Number);
      const expectedMins = (h * 60 + m + 15) % (24 * 60);
      const expectedH = String(Math.floor(expectedMins / 60)).padStart(2, "0");
      const expectedM = String(expectedMins % 60).padStart(2, "0");
      expect(updated?.scheduledDeparture).toBe(`${expectedH}:${expectedM}`);
    }
  });

  it("does not shift completed trips", async () => {
    const trips = getTrips();
    const routeId = trips[0].routeId;
    updateTrip(trips[0].id, { status: "completed" });
    const originalDep = getTrips().find(
      (t) => t.id === trips[0].id,
    )?.scheduledDeparture;
    await handler(makeReq("POST", { routeId, delayMinutes: 10 }), makeRes());
    const afterShift = getTrips().find((t) => t.id === trips[0].id);
    expect(afterShift?.scheduledDeparture).toBe(originalDep);
  });
});

describe("PATCH /api/trips/[id] (more fields)", () => {
  beforeEach(() => {
    resetTrips();
  });

  it("updates driver fields", async () => {
    const id = getTrips()[0].id;
    const res = makeRes();
    await idHandler(
      makeReq(
        "PATCH",
        {
          driverName: "Charlie",
          driverPhone: "81234567",
          plateNumber: "SGA1234B",
        },
        { id },
      ),
      res,
    );
    const body = res._data as Record<string, unknown>;
    expect(body.driverName).toBe("Charlie");
    expect(body.driverPhone).toBe("81234567");
    expect(body.plateNumber).toBe("SGA1234B");
  });

  it("updates operationalNote and busIdentifier", async () => {
    const id = getTrips()[0].id;
    const res = makeRes();
    await idHandler(
      makeReq(
        "PATCH",
        { operationalNote: "VIP bus", busIdentifier: "VIP-01" },
        { id },
      ),
      res,
    );
    const body = res._data as Record<string, unknown>;
    expect(body.operationalNote).toBe("VIP bus");
    expect(body.busIdentifier).toBe("VIP-01");
  });
});
