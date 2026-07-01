import { POST } from "@/app/api/trips/bulk-delay/route";
import { getTrips, resetTrips } from "@/lib/tripStore";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/trips/bulk-delay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/trips/bulk-delay", () => {
  beforeEach(() => {
    resetTrips();
  });

  it("shifts trips on a route and marks them delayed", async () => {
    const trips = getTrips();
    const routeId = trips[0].routeId;
    const originalDep = trips[0].scheduledDeparture;

    const req = makeRequest({ routeId, delayMinutes: 15 });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.affectedTrips).toBeGreaterThan(0);

    // Verify trip status changed
    const updated = getTrips().find((t) => t.id === trips[0].id);
    expect(updated?.status).toBe("delayed");
    // Verify departure shifted
    expect(updated?.scheduledDeparture).not.toBe(originalDep);
  });

  it("rejects missing routeId", async () => {
    const req = makeRequest({ delayMinutes: 10 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects delayMinutes <= 0", async () => {
    const req = makeRequest({ routeId: "r", delayMinutes: 0 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects delayMinutes > 180", async () => {
    const req = makeRequest({ routeId: "r", delayMinutes: 200 });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 0 affected for non-matching route", async () => {
    const req = makeRequest({ routeId: "no-such-route", delayMinutes: 10 });
    const res = await POST(req);
    const body = await res.json();
    expect(body.affectedTrips).toBe(0);
  });
});
