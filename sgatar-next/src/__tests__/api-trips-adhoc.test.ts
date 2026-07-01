import { POST } from "@/app/api/trips/adhoc/route";
import { getTrips, resetTrips } from "@/lib/tripStore";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/trips/adhoc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/trips/adhoc", () => {
  beforeEach(() => {
    resetTrips();
  });

  it("creates an ad-hoc trip", async () => {
    const before = getTrips().length;
    const req = makeRequest({
      routeId: "test-route",
      busIdentifier: "GHOST-01",
      maxCapacity: 45,
      operationalNote: "Extra bus",
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.busIdentifier).toBe("GHOST-01");
    expect(body.isAdhoc).toBe(true);
    expect(body.maxCapacity).toBe(45);
    expect(getTrips().length).toBe(before + 1);
  });

  it("defaults capacity to 40", async () => {
    const req = makeRequest({ routeId: "r", busIdentifier: "B1" });
    const res = await POST(req);
    const body = await res.json();
    expect(body.maxCapacity).toBe(40);
  });

  it("rejects missing routeId", async () => {
    const req = makeRequest({ busIdentifier: "B1" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects missing busIdentifier", async () => {
    const req = makeRequest({ routeId: "r" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects capacity > 100", async () => {
    const req = makeRequest({
      routeId: "r",
      busIdentifier: "B1",
      maxCapacity: 150,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects capacity < 1", async () => {
    const req = makeRequest({
      routeId: "r",
      busIdentifier: "B1",
      maxCapacity: 0,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
