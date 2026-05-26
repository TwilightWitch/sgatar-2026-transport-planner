/**
 * @file Monte Carlo analysis for bus fleet capacity planning.
 * @module monte-carlo
 *
 * Runs many simulation iterations to estimate the probability of overload
 * and quantifies the benefit of adding or the risk of removing a bus.
 * Results are deterministic for a given set of inputs (no `Math.random()`),
 * so the same inputs always produce the same probability estimates.
 */

import { distribute, esc } from "./utils.js";

/**
 * Aggregated results of a Monte Carlo run.
 *
 * @typedef {object} McResult
 * @property {number} n         Number of simulation runs
 * @property {number} tc        Total seat capacity of the fleet
 * @property {number} usable    Usable seats after buffer
 * @property {number} totalG    Total guests
 * @property {number} bufPct    Buffer percentage applied
 * @property {number} pAnyOver  Probability that at least one bus is overloaded
 * @property {number} avgOver   Mean number of overloaded buses per run
 * @property {number} maxOver   Maximum buses overloaded in any single run
 */

// ── CORE SIMULATION ───────────────────────────────────────────────────────────

/**
 * Runs `n` Monte Carlo simulations for a fleet and returns probability metrics.
 *
 * Total guest count is fixed; the variability setting controls how unevenly
 * demand is distributed across individual buses (mimicking guests clustering
 * at pickup points).  Each run uses a distinct deterministic seed derived
 * from Knuth's multiplicative hash, so results cover a wide spread while
 * remaining fully reproducible.
 *
 * @param {Array<{id:string|number,cap:number}>} buses   Fleet to evaluate
 * @param {number} totalG   Total guests to distribute
 * @param {number} bufPct   Buffer percentage to reserve (0–100)
 * @param {number} varPct   Demand variability percentage (0–100)
 * @param {number} n        Number of simulation runs
 * @returns {McResult}
 */
export function runMonteCarlo(buses, totalG, bufPct, varPct, n) {
  const tc = buses.reduce((a, b) => a + b.cap, 0);
  const usable = Math.floor(tc * (1 - bufPct / 100));
  let anyOverCount = 0;
  let totalOverSum = 0;
  let maxOver = 0;

  for (let i = 0; i < n; i++) {
    // Distinct deterministic seed per run (Knuth multiplicative hash)
    const seed = Math.imul(i + 1, 2654435761) >>> 0;
    const dist = distribute(totalG, buses.length, varPct, seed);
    let over = 0;
    for (let j = 0; j < buses.length; j++) {
      if ((dist[j] ?? 0) > buses[j].cap) over++;
    }
    if (over > 0) anyOverCount++;
    totalOverSum += over;
    if (over > maxOver) maxOver = over;
  }

  return {
    n,
    tc,
    usable,
    totalG,
    bufPct,
    pAnyOver: n > 0 ? anyOverCount / n : 0,
    avgOver: n > 0 ? totalOverSum / n : 0,
    maxOver,
  };
}

/**
 * Returns Monte Carlo results for the fleet resized by `delta` (+1 or -1).
 *
 * - An added bus receives the fleet's current average capacity.
 * - The removed bus is the last entry in the list (typically a spare/overflow).
 * - Returns `null` when removing would leave an empty fleet.
 *
 * @param {Array<{id:string|number,cap:number}>} buses
 * @param {number} totalG
 * @param {number} bufPct
 * @param {number} varPct
 * @param {number} n
 * @param {number} delta  +1 to add a bus, -1 to remove one
 * @returns {McResult|null}
 */
export function mcFleetDelta(buses, totalG, bufPct, varPct, n, delta) {
  if (delta < 0 && buses.length <= 1) return null;
  if (!buses.length) return null;
  const avgCap = Math.round(
    buses.reduce((a, b) => a + b.cap, 0) / buses.length,
  );
  const fleet =
    delta > 0 ? [...buses, { id: "+1", cap: avgCap }] : buses.slice(0, -1);
  return runMonteCarlo(fleet, totalG, bufPct, varPct, n);
}

// ── RENDERING ─────────────────────────────────────────────────────────────────

/**
 * Renders Monte Carlo analysis results into the element identified by `tid`.
 *
 * Displays four summary statistics and a three-row fleet-size impact table
 * (−1 bus / current / +1 bus) so planners can see the probability benefit of
 * adding or the cost of removing a vehicle.
 *
 * @param {Array<{id:string|number,cap:number,from:string,to:string}>} buses
 * @param {number} totalG
 * @param {number} bufPct
 * @param {number} varPct
 * @param {number} n      Number of MC runs
 * @param {string} tid    Target element ID
 */
export function renderMcOut(buses, totalG, bufPct, varPct, n, tid) {
  const el = document.getElementById(tid);
  if (!el) return;
  if (!buses.length) {
    el.innerHTML =
      '<div class="card"><p style="color:var(--c-mut);font-size:.82rem">No buses in this service to analyse.</p></div>';
    return;
  }
  const mc = runMonteCarlo(buses, totalG, bufPct, varPct, n);
  const mcMinus = mcFleetDelta(buses, totalG, bufPct, varPct, n, -1);
  // delta > 0 never triggers the null-return path, so this cast is safe.
  const mcPlus = /** @type {McResult} */ (
    mcFleetDelta(buses, totalG, bufPct, varPct, n, +1)
  );
  el.innerHTML = buildMcHtml(mc, mcMinus, mcPlus, buses.length);
}

// ── HTML BUILDERS ─────────────────────────────────────────────────────────────

/** @param {number} v @returns {string} */
const fPct = (v) => `${(v * 100).toFixed(1)}%`;

/** @param {number} k @returns {string} */
const busWord = (k) => `bus${k === 1 ? "" : "es"}`;

/**
 * Renders a coloured delta indicator relative to a baseline probability.
 * Higher probability is worse (red ▲); lower is better (green ▼).
 *
 * @param {number} base     Baseline (current-fleet) probability
 * @param {number} compare  Alternative-fleet probability
 * @returns {string}        HTML string
 */
function fDelta(base, compare) {
  const d = (compare - base) * 100;
  if (d > 0.05)
    return `<span style="color:var(--c-er)">&#9650; +${Math.abs(d).toFixed(1)}%</span>`;
  if (d < -0.05)
    return `<span style="color:var(--c-ok)">&#9660; &minus;${Math.abs(d).toFixed(1)}%</span>`;
  return `<span style="color:var(--c-mut)">&mdash;</span>`;
}

/**
 * Builds the fleet-size impact `<tr>` for one scenario.
 *
 * @param {string}   label     Row label (e.g. "+1 bus")
 * @param {number}   count     Total bus count for this scenario
 * @param {McResult} result    MC result for this scenario
 * @param {McResult} baseline  MC result for the current fleet
 * @returns {string}
 */
function buildImpactRow(label, count, result, baseline) {
  return (
    `<tr>` +
    `<td>${label} <span style="color:var(--c-mut)">(${esc(result.tc)} seats, ${esc(count)} ${busWord(count)})</span></td>` +
    `<td>${fPct(result.pAnyOver)}</td>` +
    `<td>${fDelta(baseline.pAnyOver, result.pAnyOver)}</td>` +
    `<td>${result.avgOver.toFixed(2)}</td>` +
    `<td>${esc(result.maxOver)}</td>` +
    `</tr>`
  );
}

/**
 * Derives the capacity status message for the deterministic overall check.
 *
 * @param {McResult} mc
 * @returns {string}  HTML string
 */
function buildOverallMsg(mc) {
  if (mc.totalG > mc.tc) {
    return `<strong>Over total capacity&colon;</strong> ${esc(mc.totalG)} guests exceed ${esc(mc.tc)} total seats.`;
  }
  if (mc.totalG > mc.usable) {
    return `<strong>Buffer consumed&colon;</strong> ${esc(mc.totalG)} guests exceed ${esc(mc.usable)} usable seats (${esc(mc.bufPct)}% buffer).`;
  }
  return `<strong>Capacity adequate&colon;</strong> ${esc(mc.totalG)} guests within ${esc(mc.usable)} usable seats (${esc(mc.bufPct)}% buffer).`;
}

/**
 * Builds the full Monte Carlo results HTML card.
 * Extracted from {@link renderMcOut} to keep it within cognitive-complexity limits.
 *
 * @param {McResult}      mc        Current-fleet result
 * @param {McResult|null} mcMinus   Fleet minus one bus (null if only one bus)
 * @param {McResult}      mcPlus    Fleet plus one bus
 * @param {number}        busCount  Current bus count
 * @returns {string}
 */
function buildMcHtml(mc, mcMinus, mcPlus, busCount) {
  const avgCap = Math.round(mc.tc / busCount);
  let overallSc = "ok";
  if (mc.totalG > mc.tc) overallSc = "cr";
  else if (mc.totalG > mc.usable) overallSc = "wn";
  const overallMsg = buildOverallMsg(mc);

  const statsHtml = [
    [fPct(mc.pAnyOver), "P(any bus over)"],
    [mc.avgOver.toFixed(2), "Avg overloaded"],
    [String(mc.maxOver), "Worst case"],
    [mc.n.toLocaleString(), "Runs"],
  ]
    .map(
      ([v, l]) =>
        `<div class="stat"><span class="v">${v}</span><span class="l">${esc(l)}</span></div>`,
    )
    .join("");

  const impactRows = [
    mcMinus ? buildImpactRow("&minus;1 bus", busCount - 1, mcMinus, mc) : "",
    `<tr style="background:rgba(26,79,122,0.07)">` +
      `<td><strong>Current fleet</strong> <span style="color:var(--c-mut)">(${esc(mc.tc)} seats, ${esc(busCount)} ${busWord(busCount)})</span></td>` +
      `<td><strong>${fPct(mc.pAnyOver)}</strong></td><td>&mdash;</td>` +
      `<td>${mc.avgOver.toFixed(2)}</td><td>${esc(mc.maxOver)}</td>` +
      `</tr>`,
    buildImpactRow("+1 bus", busCount + 1, mcPlus, mc),
  ].join("");

  return (
    `<div class="card">` +
    `<h3 style="font-size:.9rem;font-weight:700;margin-bottom:.6rem">Multiple Simulation Results&colon; ${mc.n.toLocaleString()} runs</h3>` +
    `<div class="rbox ${overallSc}" style="margin-bottom:.75rem"><p>${overallMsg}</p></div>` +
    `<p class="note" style="margin-bottom:.75rem">` +
    `Each run randomly distributes ${esc(mc.totalG)} guests across ${esc(busCount)} ${busWord(busCount)} using ` +
    `the variability setting. <em>P(any bus&nbsp;over)</em> is the probability that at least one bus exceeds its seat capacity on the day.` +
    `</p>` +
    `<div class="sgrid">${statsHtml}</div>` +
    `<h4 style="font-size:.78rem;font-weight:700;color:var(--c-mut);text-transform:uppercase;letter-spacing:.04em;margin:.85rem 0 .4rem">Fleet Size Impact</h4>` +
    `<div class="tbl-wrap">` +
    `<table aria-label="Fleet size impact on overload probability">` +
    `<thead><tr>` +
    `<th scope="col">Scenario</th><th scope="col">P(any bus over)</th>` +
    `<th scope="col">Change</th><th scope="col">Avg buses over</th><th scope="col">Worst case</th>` +
    `</tr></thead>` +
    `<tbody>${impactRows}</tbody>` +
    `</table></div>` +
    `<p style="font-size:.72rem;color:var(--c-mut);margin-top:.5rem">` +
    `&#177;1 bus uses average capacity of ${esc(avgCap)} seats. Guest count and variability are unchanged across all scenarios.` +
    `</p></div>`
  );
}
