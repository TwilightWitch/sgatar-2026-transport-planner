import { getTrips, resetTrips } from "@/lib/tripStore";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the middleware module
vi.mock("@/db", () => ({
  db: { select: vi.fn(), update: vi.fn(), insert: vi.fn() },
}));

describe("POST /api/trips/bulk-delay (full paths)", () => {
  beforeEach(() => {
    resetTrips();
  });

  it("correctly shifts time by 15 minutes", async () => {
    const { POST } = await import("@/app/api/trips/bulk-delay/route");
    const trips = getTrips();
    const routeId = trips[0].routeId;
    const originalDep = trips[0].scheduledDeparture; // e.g. "16:30"

    const req = new NextRequest("http://localhost/api/trips/bulk-delay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routeId, delayMinutes: 15 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const updated = getTrips().find((t) => t.id === trips[0].id);
    expect(updated?.status).toBe("delayed");

    // Verify time was shifted
    if (originalDep.includes(":")) {
      const [h, m] = originalDep.split(":").map(Number);
      const expectedMins = (h * 60 + m + 15) % (24 * 60);
      const expectedH = String(Math.floor(expectedMins / 60)).padStart(2, "0");
      const expectedM = String(expectedMins % 60).padStart(2, "0");
      expect(updated?.scheduledDeparture).toBe(`${expectedH}:${expectedM}`);
    }
  });

  it("does not shift completed trips", async () => {
    const { POST } = await import("@/app/api/trips/bulk-delay/route");
    const { updateTrip } = await import("@/lib/tripStore");
    const trips = getTrips();
    const routeId = trips[0].routeId;

    // Mark first trip as completed
    updateTrip(trips[0].id, { status: "completed" });
    const originalDep = getTrips().find(
      (t) => t.id === trips[0].id,
    )?.scheduledDeparture;

    const req = new NextRequest("http://localhost/api/trips/bulk-delay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routeId, delayMinutes: 10 }),
    });

    await POST(req);
    const afterShift = getTrips().find((t) => t.id === trips[0].id);
    expect(afterShift?.scheduledDeparture).toBe(originalDep);
  });
});

describe("PATCH /api/trips/[id] (more fields)", () => {
  beforeEach(() => {
    resetTrips();
  });

  it("updates driver fields", async () => {
    const { PATCH } = await import("@/app/api/trips/[id]/route");
    const id = getTrips()[0].id;

    const req = new NextRequest("http://localhost/api/trips/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driverName: "Charlie",
        driverPhone: "81234567",
        plateNumber: "SGA1234B",
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id }) });
    const body = await res.json();
    expect(body.driverName).toBe("Charlie");
    expect(body.driverPhone).toBe("81234567");
    expect(body.plateNumber).toBe("SGA1234B");
  });

  it("updates operationalNote and busIdentifier", async () => {
    const { PATCH } = await import("@/app/api/trips/[id]/route");
    const id = getTrips()[0].id;

    const req = new NextRequest("http://localhost/api/trips/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operationalNote: "VIP bus",
        busIdentifier: "VIP-01",
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id }) });
    const body = await res.json();
    expect(body.operationalNote).toBe("VIP bus");
    expect(body.busIdentifier).toBe("VIP-01");
  });
});
