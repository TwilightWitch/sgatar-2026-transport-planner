/**
 * @file Shared rendering and mathematical utility functions.
 * @module utils
 *
 * All exports are pure functions with no DOM side-effects, making them
 * trivial to unit-test and safe to import from any module.
 */

// ── HTML SAFETY ───────────────────────────────────────────────────────────────

/**
 * Escapes a value so it is safe to interpolate into HTML attribute values
 * and text content.  Prevents XSS from user-supplied schedule data.
 *
 * @param {string|number} value  Raw value to escape
 * @returns {string}             HTML-safe string
 */
export function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// ── CAPACITY STATUS ───────────────────────────────────────────────────────────

/** Fill ratio at or above which a bus is considered near-full. */
const NEAR_FULL_THRESHOLD = 0.8;

/**
 * Returns the CSS class name representing the capacity fill status.
 *
 * | Return  | Meaning        | Range             |
 * |---------|----------------|-------------------|
 * | `'ok'`  | Plenty of room | ratio < 0.8       |
 * | `'wn'`  | Near full      | 0.8 ≤ ratio < 1.0 |
 * | `'ov'`  | Over capacity  | ratio ≥ 1.0       |
 *
 * @param {number} ratio  Passengers ÷ capacity
 * @returns {'ok'|'wn'|'ov'}
 */
export function cls(ratio) {
  if (ratio >= 1) return "ov";
  if (ratio >= NEAR_FULL_THRESHOLD) return "wn";
  return "ok";
}

/**
 * Returns a short human-readable status label for a capacity fill ratio.
 *
 * @param {number} ratio  Passengers ÷ capacity
 * @returns {'Over'|'Near Full'|'OK'}
 */
export function lbl(ratio) {
  if (ratio > 1) return "Over";
  if (ratio >= NEAR_FULL_THRESHOLD) return "Near Full";
  return "OK";
}

// ── PRNG ──────────────────────────────────────────────────────────────────────

/**
 * Creates a seeded Linear Congruential Generator (LCG) PRNG.
 *
 * Using a deterministic PRNG instead of `Math.random()` makes simulation
 * results reproducible for a given seed — essential for the re-randomise
 * and Monte Carlo features.
 *
 * Constants (multiplier 1664525, increment 1013904223) are from Knuth's
 * _Seminumerical Algorithms_ and are a well-tested LCG parameter set.
 *
 * @param {number} seed  Unsigned 32-bit integer seed
 * @returns {() => number}  Function returning values uniformly in [0, 1)
 */
export function lcg(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/**
 * Distributes `total` passengers across `count` buses with a configurable
 * degree of unevenness, simulating real-world guest clustering at pickup
 * points.
 *
 * Each bus is assigned a random weight in [1 − spread, 1 + spread], then
 * passengers are allocated proportionally to the normalised weights.
 *
 * @param {number} total    Total passengers to distribute
 * @param {number} count    Number of buses
 * @param {number} varPct   Variability percentage (0 = even, 100 = very uneven)
 * @param {number} seed     PRNG seed (use distinct seeds across calls)
 * @returns {number[]}      Passenger counts, one per bus
 */
export function distribute(total, count, varPct, seed) {
  if (count <= 0) return [];
  const rnd = lcg(seed);
  const spread = varPct / 100;
  const weights = Array.from(
    { length: count },
    () => 1 + (rnd() * 2 - 1) * spread,
  );
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const result = weights.map((w) => Math.round((w / weightSum) * total));
  // Correct rounding drift so the sum always equals `total` exactly.
  // Drift is typically ≤ count guests; the last element absorbs it.
  const drift = result.reduce((a, b) => a + b, 0) - total;
  if (drift !== 0) result[result.length - 1] -= drift;
  return result;
}

// ── CAPACITY BAR ──────────────────────────────────────────────────────────────

/**
 * Renders an accessible, colour-coded capacity bar as an HTML string.
 *
 * The bar carries `role="img"` and an `aria-label` so screen readers
 * announce fill levels without relying on colour alone (WCAG 1.4.1).
 *
 * @param {number} pax  Planned passenger count
 * @param {number} cap  Bus seat capacity
 * @returns {string}    HTML string ready for `innerHTML` assignment
 */
export function mkBar(pax, cap) {
  if (!cap) return '<span style="color:var(--c-mut)">\u2014</span>';
  const ratio = pax / cap;
  const pct = Math.min(Math.round(ratio * 100), 100);
  const statusClass = cls(ratio);
  return (
    `<div class="bw" role="img" aria-label="${esc(pax)} of ${esc(cap)} seats, ${pct}%">` +
    `<div class="b"><div class="bf ${statusClass}" style="width:${pct}%" aria-hidden="true"></div></div>` +
    `<span class="bt">${esc(pax)}/${esc(cap)}</span></div>`
  );
}
