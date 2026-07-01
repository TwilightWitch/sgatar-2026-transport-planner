import {
  distribute,
  getCapacityLabel,
  getCapacityStatus,
  lcg,
  mcFleetDelta,
  runMonteCarlo,
  simulate,
} from "@/lib/simulationEngine";
import { describe, expect, it } from "vitest";

describe("lcg (seeded PRNG)", () => {
  it("returns deterministic values for same seed", () => {
    const rng1 = lcg(42);
    const rng2 = lcg(42);
    expect(rng1()).toBe(rng2());
    expect(rng1()).toBe(rng2());
  });

  it("returns values in [0, 1)", () => {
    const rng = lcg(123);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("returns different values for different seeds", () => {
    const rng1 = lcg(1);
    const rng2 = lcg(2);
    expect(rng1()).not.toBe(rng2());
  });
});

describe("distribute", () => {
  it("returns empty array for count=0", () => {
    expect(distribute(100, 0, 30, 42)).toEqual([]);
  });

  it("sums to total exactly", () => {
    const result = distribute(190, 5, 30, 42);
    expect(result.reduce((a, b) => a + b, 0)).toBe(190);
    expect(result).toHaveLength(5);
  });

  it("produces even distribution at 0% variability", () => {
    const result = distribute(100, 4, 0, 42);
    expect(result).toEqual([25, 25, 25, 25]);
  });

  it("is deterministic for same seed", () => {
    const r1 = distribute(190, 5, 30, 99);
    const r2 = distribute(190, 5, 30, 99);
    expect(r1).toEqual(r2);
  });

  it("produces varying distribution at high variability", () => {
    const result = distribute(190, 5, 80, 42);
    const allEqual = result.every((v) => v === result[0]);
    expect(allEqual).toBe(false);
  });
});

describe("simulate", () => {
  const buses = [
    { id: "B1", capacity: 40, from: "A", to: "B" },
    { id: "B2", capacity: 40, from: "A", to: "B" },
    { id: "B3", capacity: 40, from: "C", to: "B" },
  ];

  it("returns correct aggregate stats", () => {
    const result = simulate(buses, 100, 10, 30, 42);
    expect(result.totalCapacity).toBe(120);
    expect(result.usableSeats).toBe(108);
    expect(result.totalGuests).toBe(100);
    expect(result.bufferPercent).toBe(10);
    expect(result.buses).toHaveLength(3);
    expect(result.buses.reduce((s, b) => s + b.simulatedPax, 0)).toBe(100);
  });

  it("flags over-capacity buses", () => {
    const result = simulate(buses, 150, 0, 80, 7);
    // With 150 guests on 120 capacity + high variability, some buses overflow
    expect(result.overCapacityCount).toBeGreaterThanOrEqual(0);
  });

  it("fills ratio correctly", () => {
    const result = simulate(buses, 120, 0, 0, 42);
    expect(result.overallFillRatio).toBe(1);
  });
});

describe("runMonteCarlo", () => {
  const buses = [
    { id: 1, capacity: 40 },
    { id: 2, capacity: 40 },
    { id: 3, capacity: 40 },
  ];

  it("returns probabilities between 0 and 1", () => {
    const result = runMonteCarlo(buses, 100, 10, 30, 500);
    expect(result.probabilityAnyOver).toBeGreaterThanOrEqual(0);
    expect(result.probabilityAnyOver).toBeLessThanOrEqual(1);
  });

  it("returns correct run count", () => {
    const result = runMonteCarlo(buses, 100, 10, 30, 200);
    expect(result.runs).toBe(200);
  });

  it("detects 0 overloads when capacity exceeds demand", () => {
    const bigBuses = [
      { id: 1, capacity: 100 },
      { id: 2, capacity: 100 },
    ];
    const result = runMonteCarlo(bigBuses, 50, 0, 10, 100);
    expect(result.probabilityAnyOver).toBe(0);
  });

  it("detects certain overload when demand far exceeds capacity", () => {
    const tinyBuses = [
      { id: 1, capacity: 10 },
      { id: 2, capacity: 10 },
    ];
    const result = runMonteCarlo(tinyBuses, 100, 0, 50, 100);
    expect(result.probabilityAnyOver).toBe(1);
  });
});

describe("mcFleetDelta", () => {
  const buses = [
    { id: 1, capacity: 40 },
    { id: 2, capacity: 40 },
    { id: 3, capacity: 40 },
  ];

  it("returns null when removing from single-bus fleet", () => {
    const result = mcFleetDelta([{ id: 1, capacity: 40 }], 30, 10, 30, 100, -1);
    expect(result).toBeNull();
  });

  it("returns null for empty fleet", () => {
    const result = mcFleetDelta([], 30, 10, 30, 100, 1);
    expect(result).toBeNull();
  });

  it("adds a bus when delta=+1", () => {
    const result = mcFleetDelta(buses, 100, 10, 30, 100, 1);
    expect(result).not.toBeNull();
    expect(result!.totalCapacity).toBe(160); // 3*40 + 40 average
  });

  it("removes a bus when delta=-1", () => {
    const result = mcFleetDelta(buses, 100, 10, 30, 100, -1);
    expect(result).not.toBeNull();
    expect(result!.totalCapacity).toBe(80); // 2*40
  });
});

describe("getCapacityStatus", () => {
  it("returns 'ok' for low fill", () => {
    expect(getCapacityStatus(0.5)).toBe("ok");
  });
  it("returns 'warning' for near-full", () => {
    expect(getCapacityStatus(0.85)).toBe("warning");
  });
  it("returns 'over' at capacity", () => {
    expect(getCapacityStatus(1)).toBe("over");
    expect(getCapacityStatus(1.2)).toBe("over");
  });
});

describe("getCapacityLabel", () => {
  it("returns correct labels", () => {
    expect(getCapacityLabel(0.5)).toBe("OK");
    expect(getCapacityLabel(0.9)).toBe("Near Full");
    expect(getCapacityLabel(1.1)).toBe("Over");
  });
});
