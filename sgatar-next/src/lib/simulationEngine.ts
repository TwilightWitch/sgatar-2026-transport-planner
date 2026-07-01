/**
 * Simulation Engine — Ported from vanilla JS to strongly-typed TypeScript.
 *
 * Contains the seeded PRNG, demand distribution, single-run simulator,
 * and Monte Carlo analysis. All functions are pure with no side-effects.
 */

// ── INTERFACES ────────────────────────────────────────────────────────────────

export interface Bus {
  id: string | number;
  capacity: number;
  from?: string;
  to?: string;
}

export interface BusResult {
  id: string | number;
  from: string;
  to: string;
  capacity: number;
  simulatedPax: number;
  fillRatio: number;
}

export interface SimulationResult {
  totalGuests: number;
  totalCapacity: number;
  usableSeats: number;
  bufferPercent: number;
  overallFillRatio: number;
  buses: BusResult[];
  overCapacityCount: number;
}

export interface MonteCarloResult {
  runs: number;
  totalCapacity: number;
  usableSeats: number;
  totalGuests: number;
  bufferPercent: number;
  probabilityAnyOver: number;
  averageOverCount: number;
  maxOverCount: number;
}

// ── PRNG (Knuth LCG) ─────────────────────────────────────────────────────────

/**
 * Creates a seeded Linear Congruential Generator.
 * Constants from Knuth's Seminumerical Algorithms:
 *   multiplier = 1664525, increment = 1013904223
 *
 * @param seed - Unsigned 32-bit integer seed
 * @returns Function returning values uniformly in [0, 1)
 */
export function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return function next(): number {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// ── DISTRIBUTION ──────────────────────────────────────────────────────────────

/**
 * Distributes `total` passengers across `count` buses with configurable
 * unevenness via weighted randomisation.
 *
 * Each bus receives a weight in [1 - spread, 1 + spread], then passengers
 * are allocated proportionally. Rounding drift is corrected on the last bus.
 *
 * @param total - Total passengers to distribute
 * @param count - Number of buses
 * @param varPct - Variability percentage (0 = even, 100 = very uneven)
 * @param seed - PRNG seed for reproducibility
 * @returns Array of passenger counts, one per bus
 */
export function distribute(
  total: number,
  count: number,
  varPct: number,
  seed: number,
): number[] {
  if (count <= 0) return [];

  const rnd = lcg(seed);
  const spread = varPct / 100;
  const weights = Array.from(
    { length: count },
    () => 1 + (rnd() * 2 - 1) * spread,
  );
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const result = weights.map((w) => Math.round((w / weightSum) * total));

  // Correct rounding drift so the sum always equals `total` exactly
  const drift = result.reduce((a, b) => a + b, 0) - total;
  if (drift !== 0) {
    result[result.length - 1] -= drift;
  }

  return result;
}

// ── SINGLE SIMULATION ─────────────────────────────────────────────────────────

/**
 * Runs a single simulation distributing guests across a bus fleet.
 *
 * @param buses - Fleet definition with id, capacity, from, to
 * @param totalGuests - Total guests to distribute
 * @param bufferPercent - Buffer percentage to reserve (0–100)
 * @param variabilityPercent - Demand variability percentage (0–100)
 * @param seed - PRNG seed
 * @returns Full simulation result with per-bus breakdown
 */
export function simulate(
  buses: Bus[],
  totalGuests: number,
  bufferPercent: number,
  variabilityPercent: number,
  seed: number,
): SimulationResult {
  const totalCapacity = buses.reduce((sum, b) => sum + b.capacity, 0);
  const usableSeats = Math.floor(totalCapacity * (1 - bufferPercent / 100));
  const dist = distribute(totalGuests, buses.length, variabilityPercent, seed);

  const busResults: BusResult[] = buses.map((bus, i) => {
    const simulatedPax = dist[i] ?? 0;
    return {
      id: bus.id,
      from: bus.from ?? "",
      to: bus.to ?? "",
      capacity: bus.capacity,
      simulatedPax,
      fillRatio: bus.capacity > 0 ? simulatedPax / bus.capacity : 0,
    };
  });

  return {
    totalGuests,
    totalCapacity,
    usableSeats,
    bufferPercent,
    overallFillRatio: totalCapacity > 0 ? totalGuests / totalCapacity : 0,
    buses: busResults,
    overCapacityCount: busResults.filter((b) => b.fillRatio > 1).length,
  };
}

// ── MONTE CARLO ───────────────────────────────────────────────────────────────

/**
 * Runs N Monte Carlo simulations to estimate overload probability.
 *
 * Each run uses a distinct deterministic seed derived from Knuth's
 * multiplicative hash (golden ratio: 2654435761), producing a wide
 * spread of demand distributions while remaining fully reproducible.
 *
 * @param buses - Fleet to evaluate
 * @param totalGuests - Total guests to distribute each run
 * @param bufferPercent - Buffer percentage to reserve (0–100)
 * @param variabilityPercent - Demand variability percentage (0–100)
 * @param runs - Number of simulation iterations
 * @returns Aggregated probability metrics
 */
export function runMonteCarlo(
  buses: Bus[],
  totalGuests: number,
  bufferPercent: number,
  variabilityPercent: number,
  runs: number,
): MonteCarloResult {
  const totalCapacity = buses.reduce((sum, b) => sum + b.capacity, 0);
  const usableSeats = Math.floor(totalCapacity * (1 - bufferPercent / 100));

  let anyOverCount = 0;
  let totalOverSum = 0;
  let maxOver = 0;

  for (let i = 0; i < runs; i++) {
    // Distinct deterministic seed per run (Knuth multiplicative hash)
    const seed = Math.imul(i + 1, 2654435761) >>> 0;
    const dist = distribute(
      totalGuests,
      buses.length,
      variabilityPercent,
      seed,
    );

    let over = 0;
    for (let j = 0; j < buses.length; j++) {
      if ((dist[j] ?? 0) > buses[j].capacity) {
        over++;
      }
    }

    if (over > 0) anyOverCount++;
    totalOverSum += over;
    if (over > maxOver) maxOver = over;
  }

  return {
    runs,
    totalCapacity,
    usableSeats,
    totalGuests,
    bufferPercent,
    probabilityAnyOver: runs > 0 ? anyOverCount / runs : 0,
    averageOverCount: runs > 0 ? totalOverSum / runs : 0,
    maxOverCount: maxOver,
  };
}

/**
 * Evaluates Monte Carlo results with one bus added or removed.
 *
 * - Added bus receives fleet's current average capacity
 * - Removed bus is the last entry in the list
 * - Returns null when removing would leave an empty fleet
 *
 * @param buses - Current fleet
 * @param totalGuests - Total guests
 * @param bufferPercent - Buffer percentage
 * @param variabilityPercent - Demand variability
 * @param runs - Number of MC iterations
 * @param delta - +1 to add, -1 to remove
 * @returns Monte Carlo result for modified fleet, or null
 */
export function mcFleetDelta(
  buses: Bus[],
  totalGuests: number,
  bufferPercent: number,
  variabilityPercent: number,
  runs: number,
  delta: 1 | -1,
): MonteCarloResult | null {
  if (delta === -1 && buses.length <= 1) return null;
  if (buses.length === 0) return null;

  const avgCap = Math.round(
    buses.reduce((sum, b) => sum + b.capacity, 0) / buses.length,
  );

  const fleet: Bus[] =
    delta > 0 ? [...buses, { id: "+1", capacity: avgCap }] : buses.slice(0, -1);

  return runMonteCarlo(
    fleet,
    totalGuests,
    bufferPercent,
    variabilityPercent,
    runs,
  );
}

// ── CAPACITY HELPERS ──────────────────────────────────────────────────────────

export type CapacityStatus = "ok" | "warning" | "over";

export function getCapacityStatus(ratio: number): CapacityStatus {
  if (ratio >= 1) return "over";
  if (ratio >= 0.8) return "warning";
  return "ok";
}

export function getCapacityLabel(ratio: number): string {
  if (ratio >= 1) return "Over";
  if (ratio >= 0.8) return "Near Full";
  return "OK";
}
