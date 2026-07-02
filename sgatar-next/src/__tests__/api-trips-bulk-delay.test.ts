import { getTrips, resetTrips } from "@/lib/tripStore";
import handler from "@/pages/api/trips/bulk-delay";
import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it } from "vitest";

function makeReq(body: Record<string, unknown>): NextApiRequest {
  return {
    method: "POST",
    body,
    query: {},
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

describe("POST /api/trips/bulk-delay", () => {
  beforeEach(() => {
    resetTrips();
  });

  it("shifts trips on a route and marks them delayed", async () => {
    const trips = getTrips();
    const routeId = trips[0].routeId;
    const originalDep = trips[0].scheduledDeparture;
    const res = makeRes();
    await handler(makeReq({ routeId, delayMinutes: 15 }), res);
    expect(res._status).toBe(200);
    const body = res._data as { affectedTrips: number };
    expect(body.affectedTrips).toBeGreaterThan(0);
    const updated = getTrips().find((t) => t.id === trips[0].id);
    expect(updated?.status).toBe("delayed");
    expect(updated?.scheduledDeparture).not.toBe(originalDep);
  });

  it("rejects missing routeId", async () => {
    const res = makeRes();
    await handler(makeReq({ delayMinutes: 10 }), res);
    expect(res._status).toBe(400);
  });

  it("rejects delayMinutes <= 0", async () => {
    const res = makeRes();
    await handler(makeReq({ routeId: "r", delayMinutes: 0 }), res);
    expect(res._status).toBe(400);
  });

  it("rejects delayMinutes > 180", async () => {
    const res = makeRes();
    await handler(makeReq({ routeId: "r", delayMinutes: 200 }), res);
    expect(res._status).toBe(400);
  });

  it("returns 0 affected for non-matching route", async () => {
    const res = makeRes();
    await handler(makeReq({ routeId: "no-such-route", delayMinutes: 10 }), res);
    const body = res._data as { affectedTrips: number };
    expect(body.affectedTrips).toBe(0);
  });

  it("clearDelay resets delayed trips to scheduled", async () => {
    const trips = getTrips();
    const routeId = trips[0].routeId;
    // First apply a delay
    const applyRes = makeRes();
    await handler(makeReq({ routeId, delayMinutes: 10 }), applyRes);
    // Then clear it
    const clearRes = makeRes();
    await handler(makeReq({ routeId, clearDelay: true }), clearRes);
    expect(clearRes._status).toBe(200);
    const updated = getTrips().find((t) => t.id === trips[0].id);
    expect(updated?.status).toBe("scheduled");
  });
});
