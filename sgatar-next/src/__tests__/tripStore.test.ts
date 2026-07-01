import type { TripWithRoute } from "@/hooks/useLiveFleet";
import {
  addTrip,
  deleteTrip,
  getTrips,
  resetTrips,
  updateTrip,
} from "@/lib/tripStore";
import { beforeEach, describe, expect, it } from "vitest";

describe("tripStore", () => {
  beforeEach(() => {
    resetTrips();
  });

  describe("getTrips", () => {
    it("returns an array of trips", () => {
      const trips = getTrips();
      expect(Array.isArray(trips)).toBe(true);
      expect(trips.length).toBeGreaterThan(0);
    });

    it("returns same reference on repeated calls", () => {
      const a = getTrips();
      const b = getTrips();
      expect(a).toBe(b);
    });

    it("all trips have required fields", () => {
      const trips = getTrips();
      for (const trip of trips) {
        expect(trip.id).toBeDefined();
        expect(trip.busIdentifier).toBeDefined();
        expect(trip.maxCapacity).toBeGreaterThan(0);
        expect(trip.status).toBe("scheduled");
        expect(trip.conferenceDay).toBeDefined();
        expect(trip.serviceName).toBeDefined();
      }
    });
  });

  describe("updateTrip", () => {
    it("updates an existing trip", () => {
      const trips = getTrips();
      const id = trips[0].id;
      const result = updateTrip(id, { currentPax: 25 });
      expect(result).not.toBeNull();
      expect(result!.currentPax).toBe(25);
      expect(result!.id).toBe(id);
    });

    it("returns null for non-existent id", () => {
      const result = updateTrip("non-existent-id", { currentPax: 5 });
      expect(result).toBeNull();
    });

    it("cannot override the id field", () => {
      const trips = getTrips();
      const originalId = trips[0].id;
      const result = updateTrip(originalId, {
        id: "hacked",
      } as Partial<TripWithRoute>);
      expect(result!.id).toBe(originalId);
    });

    it("preserves other fields", () => {
      const trips = getTrips();
      const original = { ...trips[0] };
      updateTrip(original.id, { currentPax: 99 });
      const updated = trips[0];
      expect(updated.busIdentifier).toBe(original.busIdentifier);
      expect(updated.serviceName).toBe(original.serviceName);
    });
  });

  describe("addTrip", () => {
    it("adds a trip to the store", () => {
      const before = getTrips().length;
      const newTrip: TripWithRoute = {
        id: "test-add",
        routeId: "route-1",
        busIdentifier: "TEST-1",
        maxCapacity: 50,
        currentPax: 0,
        assignedLoCount: 1,
        status: "scheduled",
        actualDepartureTime: null,
        actualArrivalTime: null,
        operationalNote: null,
        isSos: false,
        sosMessage: null,
        isAdhoc: true,
        conferenceDay: "7 Sep (Mon)",
        serviceName: "Test Service",
        targetArrival: "10:00",
        pickupLocation: "Hotel",
        dropoffLocation: "MBS",
        scheduledDeparture: "09:30",
        scheduledArrival: "09:50",
        driverName: null,
        driverPhone: null,
        plateNumber: null,
      };
      addTrip(newTrip);
      expect(getTrips().length).toBe(before + 1);
      expect(getTrips().find((t) => t.id === "test-add")).toBeDefined();
    });
  });

  describe("deleteTrip", () => {
    it("removes an existing trip", () => {
      const trips = getTrips();
      const id = trips[0].id;
      const before = trips.length;
      const result = deleteTrip(id);
      expect(result).toBe(true);
      expect(getTrips().length).toBe(before - 1);
      expect(getTrips().find((t) => t.id === id)).toBeUndefined();
    });

    it("returns false for non-existent id", () => {
      const result = deleteTrip("does-not-exist");
      expect(result).toBe(false);
    });
  });

  describe("resetTrips", () => {
    it("resets to initial state", () => {
      const trips = getTrips();
      const originalLength = trips.length;
      deleteTrip(trips[0].id);
      expect(getTrips().length).toBe(originalLength - 1);
      resetTrips();
      expect(getTrips().length).toBe(originalLength);
    });
  });
});
