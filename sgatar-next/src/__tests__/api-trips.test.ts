import { GET as healthGET } from "@/app/api/health/route";
import { GET } from "@/app/api/trips/route";
import { resetTrips } from "@/lib/tripStore";
import { beforeEach, describe, expect, it } from "vitest";

describe("GET /api/trips", () => {
  beforeEach(() => {
    resetTrips();
  });

  it("returns 200 with array of trips", async () => {
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it("trips have expected fields", async () => {
    const res = await GET();
    const body = await res.json();
    const trip = body[0];
    expect(trip.id).toBeDefined();
    expect(trip.busIdentifier).toBeDefined();
    expect(trip.conferenceDay).toBeDefined();
    expect(trip.status).toBe("scheduled");
  });
});

describe("GET /api/health", () => {
  it("returns 200 with status ok", async () => {
    const res = healthGET();
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });
});
