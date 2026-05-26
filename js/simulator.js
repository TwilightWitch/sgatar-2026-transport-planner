/**
 * @file Scheduled-service demand simulator.
 * @module simulator
 *
 * Provides functions to populate the service dropdown, run a single
 * demand simulation and render its results.  Imports `group` from
 * schedule.js (one-way dependency: schedule.js does not import this
 * module, preventing circular references).
 */

import { group } from "./schedule.js";
import { state } from "./state.js";
import { cls, distribute, esc, lbl } from "./utils.js";

/** @typedef {import("./data.js").ScheduleRow} ScheduleRow */

/**
 * A service extracted from the live schedule, ready for simulation.
 *
 * @typedef {object} ServiceSummary
 * @property {string}        dayLabel  Conference day label
 * @property {string}        name      Service / route name
 * @property {string}        arr       Target arrival time
 * @property {ScheduleRow[]} buses     Schedule rows for this service
 */

/**
 * Per-bus result after a simulation run.
 *
 * @typedef {object} BusResult
 * @property {string|number} id    Bus identifier
 * @property {string}        from  Pickup location
 * @property {string}        to    Drop-off location
 * @property {number}        cap   Seat capacity
 * @property {number}        sp    Simulated passenger count
 * @property {number}        ratio sp ÷ cap
 */

/**
 * Aggregated result of one simulation run.
 *
 * @typedef {object} SimResult
 * @property {number}       totalG  Total guests
 * @property {number}       tc      Total seat capacity
 * @property {number}       usable  Usable seats after buffer
 * @property {number}       bufPct  Buffer percentage applied
 * @property {number}       or      Overall fill ratio (totalG ÷ tc)
 * @property {BusResult[]}  buses   Per-bus results
 * @property {number}       oc      Buses over capacity
 */

// ── SERVICE SELECTOR ──────────────────────────────────────────────────────────

/**
 * Extracts all services from the current schedule grouped by day.
 * Used to populate the service dropdown and look up buses for simulation.
 *
 * @returns {ServiceSummary[]}
 */
export function getSvcs() {
  return group(state.schedule).flatMap((day) =>
    Array.from(day.svcs.values()).map((svc) => ({
      dayLabel: day.label,
      name: svc.name,
      arr: svc.arr,
      buses: svc.buses,
    })),
  );
}

/**
 * Populates the `#ss-svc` `<select>` with the current services and
 * syncs the guest-count input to the selected service's planned total.
 */
export function populateSel() {
  const sel = /** @type {HTMLSelectElement|null} */ (
    document.getElementById("ss-svc")
  );
  if (!sel) return;
  const svcs = getSvcs();
  sel.innerHTML = svcs
    .map(
      (s, i) =>
        `<option value="${i}">${esc(s.dayLabel)} \u2014 ${esc(s.name)}</option>`,
    )
    .join("");
  syncGuests(svcs);
}

/**
 * Syncs the `#ss-g` input to the planned total of the currently selected service.
 * Leaves the input unchanged when the selected service has no buses.
 *
 * @param {ServiceSummary[]} svcs  Current services list
 */
export function syncGuests(svcs) {
  const sel = /** @type {HTMLSelectElement|null} */ (
    document.getElementById("ss-svc")
  );
  const inp = /** @type {HTMLInputElement|null} */ (
    document.getElementById("ss-g")
  );
  if (!sel || !inp) return;
  const svc = svcs[Number.parseInt(sel.value, 10)];
  if (svc) {
    inp.value = String(svc.buses.reduce((a, b) => a + b.pax, 0));
  }
}

// ── SIMULATION ────────────────────────────────────────────────────────────────

/**
 * Runs a single simulation, distributing `totalG` guests across the fleet
 * using a seeded PRNG to model realistic demand variability.
 *
 * @param {Array<{id:string|number,from:string,to:string,cap:number}>} buses
 * @param {number} totalG   Total guests
 * @param {number} bufPct   Buffer percentage (0–100)
 * @param {number} varPct   Demand variability percentage (0–100)
 * @param {number} seed     PRNG seed
 * @returns {SimResult}
 */
export function simulate(buses, totalG, bufPct, varPct, seed) {
  const tc = buses.reduce((a, b) => a + b.cap, 0);
  const usable = Math.floor(tc * (1 - bufPct / 100));
  const dist = distribute(totalG, buses.length, varPct, seed);
  const busResults = buses.map((bus, i) => {
    const sp = dist[i] ?? 0;
    return {
      id: bus.id,
      from: bus.from,
      to: bus.to,
      cap: bus.cap,
      sp,
      ratio: bus.cap ? sp / bus.cap : 0,
    };
  });
  return {
    totalG,
    tc,
    usable,
    bufPct,
    or: tc ? totalG / tc : 0,
    buses: busResults,
    oc: busResults.filter((b) => b.ratio > 1).length,
  };
}

// ── RENDERING ─────────────────────────────────────────────────────────────────

/**
 * Renders a simulation result into the element identified by `tid`.
 *
 * @param {SimResult} result
 * @param {string}    tid     Target element ID
 */
export function renderOut(result, tid) {
  const el = document.getElementById(tid);
  if (!el) return;
  el.innerHTML = buildSimHtml(result);
}

/**
 * Builds the full HTML string for a simulation result card.
 * Extracted to keep {@link renderOut} within cognitive-complexity limits.
 *
 * @param {SimResult} result
 * @returns {string}
 */
function buildSimHtml(result) {
  const { totalG: tg, tc, usable, bufPct, or: ovR, buses, oc } = result;
  const { statusClass, headline, subline } = deriveStatus(
    tg,
    tc,
    usable,
    bufPct,
    buses.length,
    oc,
  );

  const statsHtml = [
    ["Guests", tg],
    ["Total Seats", tc],
    [`Usable (\u2212${bufPct}%)`, usable],
    ["Fill Rate", `${Math.round(ovR * 100)}%`],
    ["Buses", buses.length],
    ["Over Cap", oc],
  ]
    .map(
      ([label, value]) =>
        `<div class="stat"><span class="v">${esc(/** @type {string|number} */ (value))}</span><span class="l">${esc(/** @type {string|number} */ (label))}</span></div>`,
    )
    .join("");

  const rowsHtml = buses.map((bus) => buildBusResultRow(bus)).join("");

  const tip =
    oc > 0 && tg <= tc
      ? '<p class="note" style="margin-top:.75rem"><strong>Tip:</strong> Station coordinators can redirect guests to less-loaded buses at pickup points to rebalance demand on the day.</p>'
      : "";

  return (
    `<div class="card">` +
    `<div class="rbox ${statusClass}" role="status"><h3>${esc(headline)}</h3><p>${esc(subline)}</p>` +
    `<div class="sgrid">${statsHtml}</div></div>` +
    `${tip}` +
    `<div class="tbl-wrap" style="margin-top:.75rem">` +
    `<table aria-label="Simulated bus loads">` +
    `<thead><tr>` +
    `<th scope="col">Bus</th><th scope="col">From</th><th scope="col">To</th>` +
    `<th scope="col">Simulated Load</th><th scope="col">Status</th>` +
    `</tr></thead>` +
    `<tbody>${rowsHtml}</tbody>` +
    `</table></div></div>`
  );
}

/**
 * Builds an HTML table row for one bus in the simulation result.
 *
 * @param {BusResult} bus
 * @returns {string}
 */
function buildBusResultRow(bus) {
  const pct = Math.min(Math.round(bus.ratio * 100), 100);
  const c = cls(bus.ratio);
  return (
    `<tr>` +
    `<td><strong>Bus ${esc(bus.id)}</strong></td>` +
    `<td>${esc(bus.from)}</td><td>${esc(bus.to)}</td>` +
    `<td><div class="bw" role="img" aria-label="${esc(bus.sp)} of ${esc(bus.cap)}">` +
    `<div class="b"><div class="bf ${c}" style="width:${pct}%"></div></div>` +
    `<span class="bt">${esc(bus.sp)}/${esc(bus.cap)}</span></div></td>` +
    `<td><span class="badge ${c}">${lbl(bus.ratio)}</span></td>` +
    `</tr>`
  );
}

/**
 * Derives the status class, headline and sub-line text for the result banner.
 *
 * @param {number} tg        Total guests
 * @param {number} tc        Total capacity
 * @param {number} usable    Usable seats after buffer
 * @param {number} bufPct    Buffer percentage
 * @param {number} busCount  Number of buses
 * @param {number} oc        Buses over capacity
 * @returns {{ statusClass: string, headline: string, subline: string }}
 */
function deriveStatus(tg, tc, usable, bufPct, busCount, oc) {
  if (tg > tc) {
    const avgCapPerBus = busCount > 0 ? tc / busCount : 1;
    const extra = Math.ceil((tg - tc) / Math.max(avgCapPerBus, 1));
    return {
      statusClass: "cr",
      headline: `Over capacity \u2014 ~${extra} more bus${extra === 1 ? "" : "es"} needed`,
      subline: `${tg} guests exceed total capacity of ${tc} seats.`,
    };
  }
  if (tg > usable) {
    return {
      statusClass: "wn",
      headline: "Buffer consumed \u2014 consider adding a bus",
      subline: `${tg} guests exceed buffered capacity of ${usable}. No safety margin remains.`,
    };
  }
  if (oc > 0) {
    return {
      statusClass: "wn",
      headline: `${oc} bus${oc === 1 ? "" : "es"} over capacity (uneven demand)`,
      subline:
        "Total capacity is sufficient but clustering is overloading individual buses. Redistribute on the day.",
    };
  }
  return {
    statusClass: "ok",
    headline: "Capacity adequate",
    subline: `${tg} guests fit within ${usable} usable seats (${bufPct}% buffer reserved).`,
  };
}
