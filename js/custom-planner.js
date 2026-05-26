/**
 * @file Custom scenario planner: build an ad-hoc fleet and simulate it.
 * @module custom-planner
 *
 * Lets users define a fleet from scratch (independent of the scheduled
 * routes) and run a single simulation against it.  Bus data lives in
 * {@link module:state~state.customBuses}.
 */

import { state } from "./state.js";
import { esc } from "./utils.js";

/** @typedef {import("./state.js").CustomBus} CustomBus */

/** Default seat capacity assigned to a newly created bus. */
const DEFAULT_CAPACITY = 40;

/** Default planned passenger count assigned to a newly created bus. */
const DEFAULT_PAX = 20;

// ── BUS MANAGEMENT ────────────────────────────────────────────────────────────

/**
 * Creates a new {@link CustomBus} with an auto-incremented ID and sensible
 * defaults.  Mutates `state.customBusIdCounter`.
 *
 * @returns {CustomBus}
 */
export function mkBus() {
  state.customBusIdCounter += 1;
  return {
    id: state.customBusIdCounter,
    from: "",
    to: "",
    capacity: DEFAULT_CAPACITY,
    plannedPax: DEFAULT_PAX,
  };
}

// ── RENDERING ─────────────────────────────────────────────────────────────────

/**
 * Renders the current custom bus list into `#cs-list`.
 * Shows a placeholder message when no buses have been added yet.
 */
export function renderCustom() {
  const el = document.getElementById("cs-list");
  if (!el) return;
  if (!state.customBuses.length) {
    el.innerHTML =
      '<p style="color:var(--c-mut);font-size:.82rem;padding:.5rem 0">No buses added. Click &ldquo;+ Add Bus&rdquo; to begin.</p>';
    return;
  }
  el.innerHTML = state.customBuses.map(buildBusItemHtml).join("");
}

/**
 * Builds the `<li>` HTML for one editable custom bus row.
 *
 * @param {CustomBus} bus
 * @returns {string}
 */
function buildBusItemHtml(bus) {
  const { id } = bus;
  return (
    `<li class="ber">` +
    `<div class="fe"><label for="cf${id}">From</label>` +
    `<input type="text" id="cf${id}" value="${esc(bus.from)}" placeholder="Pickup" data-id="${id}" data-f="from"></div>` +
    `<div class="fe"><label for="ct${id}">To</label>` +
    `<input type="text" id="ct${id}" value="${esc(bus.to)}" placeholder="Drop-off" data-id="${id}" data-f="to"></div>` +
    `<div class="fe"><label for="cc${id}">Cap</label>` +
    `<input type="number" id="cc${id}" value="${esc(bus.capacity)}" min="1" max="200" data-id="${id}" data-f="cap" style="text-align:center"></div>` +
    `<div class="fe"><label for="cp${id}">Pax</label>` +
    `<input type="number" id="cp${id}" value="${esc(bus.plannedPax)}" min="0" max="200" data-id="${id}" data-f="pax" style="text-align:center"></div>` +
    `<button class="btn btn-d btn-sm" type="button" data-rm="${id}" aria-label="Remove bus ${esc(id)}">\u2715</button>` +
    `</li>`
  );
}

// ── SYNC ──────────────────────────────────────────────────────────────────────

/**
 * Reads current DOM input values and syncs them back into `state.customBuses`.
 * Must be called before any operation that reads bus data (run, add, remove).
 */
export function syncCustom() {
  state.customBuses = state.customBuses.map((bus) => {
    const { id } = bus;
    const getVal = (/** @type {string} */ elId) =>
      /** @type {HTMLInputElement|null} */ (document.getElementById(elId))
        ?.value ?? "";
    return {
      id,
      from: getVal(`cf${id}`),
      to: getVal(`ct${id}`),
      capacity: Math.max(
        Number.parseInt(getVal(`cc${id}`), 10) || DEFAULT_CAPACITY,
        1,
      ),
      plannedPax: Math.max(Number.parseInt(getVal(`cp${id}`), 10) || 0, 0),
    };
  });
}
