/**
 * @file Application entry point for SGATAR 2026 Transport Planner.
 * @module app
 *
 * Imports all feature modules, wires event listeners and fires the initial
 * render once the DOM is ready.  All mutable state lives in
 * {@link module:state~state}; modules communicate through it rather than
 * via direct cross-module function calls, preventing circular imports.
 */

import { downloadCSV, handleFile } from "./js/csv.js";
import { mkBus, renderCustom, syncCustom } from "./js/custom-planner.js";
import { renderMcOut } from "./js/monte-carlo.js";
import { initScheduleEditing, renderSched } from "./js/schedule.js";
import {
  getSvcs,
  populateSel,
  renderOut,
  simulate,
  syncGuests,
} from "./js/simulator.js";
import { resetSchedule, state } from "./js/state.js";
import { initTabs } from "./js/tabs.js";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

/** Maximum Monte Carlo runs allowed (prevents UI freezes on large n). */
const MC_MAX_RUNS = 50_000;

/** Minimum Monte Carlo runs (below this, estimates are too noisy). */
const MC_MIN_RUNS = 100;

// ── HELPERS ───────────────────────────────────────────────────────────────────

/**
 * Returns an integer parsed from a named input element, or 0 on failure.
 *
 * @param {string} id  Element ID
 * @returns {number}
 */
function intInput(id) {
  return (
    Number.parseInt(
      /** @type {HTMLInputElement} */ (document.getElementById(id))?.value ??
        "0",
      10,
    ) || 0
  );
}

/**
 * Reads the three shared simulator inputs (guests, buffer %, variability %).
 *
 * @returns {{ guests: number, bufPct: number, varPct: number }}
 */
function readSimInputs() {
  return {
    guests: intInput("ss-g"),
    bufPct: intInput("ss-buf"),
    varPct: intInput("ss-var"),
  };
}

/**
 * Looks up the currently selected service and returns its buses mapped for
 * simulation functions.  Returns `null` when nothing is selected.
 *
 * @returns {Array<{id:string|number,from:string,to:string,cap:number}>|null}
 */
function getSimBuses() {
  const sel = /** @type {HTMLSelectElement|null} */ (
    document.getElementById("ss-svc")
  );
  if (!sel) return null;
  const svcs = getSvcs();
  const svc = svcs[Number.parseInt(sel.value, 10)];
  if (!svc) return null;
  return svc.buses.map((b) => ({
    id: b.id,
    from: b.from,
    to: b.to,
    cap: b.cap,
  }));
}

// ── EVENT WIRING ──────────────────────────────────────────────────────────────

/** Wires range-slider inputs to their live value labels. */
function wireSliders() {
  [
    ["ss-buf", "ss-bv"],
    ["ss-var", "ss-vv"],
  ].forEach(([rangeId, labelId]) => {
    const rangeEl = document.getElementById(rangeId);
    const labelEl = document.getElementById(labelId);
    if (rangeEl && labelEl) {
      rangeEl.addEventListener("input", () => {
        labelEl.textContent = /** @type {HTMLInputElement} */ (rangeEl).value;
      });
    }
  });
}

/** Wires the single-simulation Run and Re-randomise buttons. */
function wireSimulator() {
  document
    .getElementById("ss-svc")
    ?.addEventListener("change", () => syncGuests(getSvcs()));

  document.getElementById("ss-run")?.addEventListener("click", () => {
    const buses = getSimBuses();
    if (!buses) return;
    state.simSeed = Date.now() & 0x7fffffff;
    const { guests, bufPct, varPct } = readSimInputs();
    renderOut(
      simulate(buses, guests, bufPct, varPct, state.simSeed),
      "sim-out",
    );
  });

  document.getElementById("ss-re")?.addEventListener("click", () => {
    if (!document.getElementById("sim-out")?.innerHTML) return;
    state.simSeed = (Math.imul(state.simSeed, 69069) + 1) & 0x7fffffff;
    const buses = getSimBuses();
    if (!buses) return;
    const { guests, bufPct, varPct } = readSimInputs();
    renderOut(
      simulate(buses, guests, bufPct, varPct, state.simSeed),
      "sim-out",
    );
  });
}

/** Wires the Monte Carlo analysis button. */
function wireMonteCarlo() {
  document.getElementById("ss-mc")?.addEventListener("click", () => {
    const buses = getSimBuses();
    if (!buses) return;
    const rawN = intInput("ss-mc-n") || MC_MIN_RUNS;
    const n = Math.min(MC_MAX_RUNS, Math.max(MC_MIN_RUNS, rawN));
    const { guests, bufPct, varPct } = readSimInputs();
    renderMcOut(buses, guests, bufPct, varPct, n, "mc-out");
  });
}

/** Wires CSV export/import and reset controls. */
function wireCsv() {
  document.getElementById("btn-dl")?.addEventListener("click", downloadCSV);

  document.getElementById("btn-rst")?.addEventListener("click", () => {
    resetSchedule();
    const upSt = document.getElementById("up-st");
    if (upSt) upSt.innerHTML = "";
  });

  const dropZone = document.getElementById("drop-z");
  const fileInput = /** @type {HTMLInputElement|null} */ (
    document.getElementById("csv-fi")
  );
  const browseBtn = document.getElementById("drop-browse");

  if (dropZone && fileInput) {
    browseBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      fileInput.click();
    });
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("drag");
    });
    dropZone.addEventListener("dragleave", () =>
      dropZone.classList.remove("drag"),
    );
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("drag");
      const file = /** @type {DragEvent} */ (e).dataTransfer?.files[0];
      if (file) handleFile(file);
    });
    fileInput.addEventListener("change", () => {
      if (fileInput.files?.[0]) {
        handleFile(fileInput.files[0]);
        fileInput.value = "";
      }
    });
  }
}

/** Wires all custom scenario planner controls. */
function wireCustomPlanner() {
  document.getElementById("cs-add")?.addEventListener("click", () => {
    syncCustom();
    state.customBuses.push(mkBus());
    renderCustom();
  });

  document.getElementById("cs-clr")?.addEventListener("click", () => {
    state.customBuses = [];
    state.customBusIdCounter = 0;
    renderCustom();
    const custOut = document.getElementById("cust-out");
    if (custOut) custOut.innerHTML = "";
  });

  document.getElementById("cs-run")?.addEventListener("click", () => {
    syncCustom();
    const custOut = document.getElementById("cust-out");
    if (!custOut) return;
    if (!state.customBuses.length) {
      custOut.innerHTML =
        '<div class="card"><p style="color:var(--c-mut);font-size:.82rem">Add at least one bus first.</p></div>';
      return;
    }
    const tg = state.customBuses.reduce((a, b) => a + b.plannedPax, 0);
    const bufPct = intInput("cs-b");
    const varPct = intInput("cs-v");
    const buses = state.customBuses.map((b) => ({
      id: b.id,
      from: b.from,
      to: b.to,
      cap: b.capacity,
    }));
    renderOut(
      simulate(buses, tg, bufPct, varPct, Date.now() & 0x7fffffff),
      "cust-out",
    );
  });

  document.getElementById("cs-list")?.addEventListener("click", (e) => {
    const btn = /** @type {HTMLElement} */ (e.target).closest("[data-rm]");
    if (!btn) return;
    syncCustom();
    const rid = Number.parseInt(
      /** @type {HTMLElement} */ (btn).dataset.rm ?? "",
      10,
    );
    state.customBuses = state.customBuses.filter((b) => b.id !== rid);
    renderCustom();
  });
}

// ── INIT ──────────────────────────────────────────────────────────────────────

/**
 * Performs the initial render and wires all event listeners.
 * Called once the DOM is ready via `DOMContentLoaded`.
 */
function init() {
  // Register the schedule-change callback so any mutation triggers both a
  // re-render of the schedule table and a refresh of the service selector.
  state.onScheduleChange = () => {
    renderSched();
    populateSel();
  };

  renderSched();
  populateSel();
  initTabs();
  initScheduleEditing();

  wireSliders();
  wireSimulator();
  wireMonteCarlo();
  wireCsv();
  wireCustomPlanner();
}

document.addEventListener("DOMContentLoaded", init);
