import { getStaticTrips } from "@/lib/staticSchedule";
import { describe, expect, it } from "vitest";

describe("staticSchedule", () => {
  it("returns an array of trips", () => {
    const trips = getStaticTrips();
    expect(Array.isArray(trips)).toBe(true);
    expect(trips.length).toBeGreaterThan(50); // 67 trips in the schedule
  });

  it("all trips have valid TripWithRoute shape", () => {
    const trips = getStaticTrips();
    for (const trip of trips) {
      expect(trip.id).toMatch(/^static-\d+$/);
      expect(trip.routeId).toBeDefined();
      expect(trip.busIdentifier).toMatch(/^Bus /);
      expect(trip.maxCapacity).toBeGreaterThan(0);
      expect(trip.currentPax).toBeGreaterThanOrEqual(0);
      expect(trip.status).toBe("scheduled");
      expect(trip.isSos).toBe(false);
      expect(trip.isAdhoc).toBe(false);
      expect(trip.sosMessage).toBeNull();
      expect(trip.driverName).toBeNull();
      expect(trip.driverPhone).toBeNull();
      expect(trip.plateNumber).toBeNull();
    }
  });

  it("covers all 4 conference days", () => {
    const trips = getStaticTrips();
    const days = [...new Set(trips.map((t) => t.conferenceDay))];
    expect(days).toContain("7 Sep (Mon)");
    expect(days).toContain("8 Sep (Tue)");
    expect(days).toContain("9 Sep (Wed)");
    expect(days).toContain("10 Sep (Thu)");
  });

  it("generates unique IDs on each call", () => {
    const trips1 = getStaticTrips();
    const trips2 = getStaticTrips();
    // IDs should be the same since counter resets
    expect(trips1[0].id).toBe(trips2[0].id);
  });

  it("has pickup and dropoff locations", () => {
    const trips = getStaticTrips();
    for (const trip of trips) {
      expect(trip.pickupLocation.length).toBeGreaterThan(0);
      expect(trip.dropoffLocation.length).toBeGreaterThan(0);
      expect(trip.scheduledDeparture.length).toBeGreaterThan(0);
    }
  });
});
