/**
 * @file Schedule rendering and inline editing.
 * @module schedule
 *
 * Renders the transport schedule as a set of editable HTML tables and
 * handles structural mutations (add/remove rows) via event delegation.
 * Numeric field changes trigger a lightweight partial DOM refresh;
 * structural changes fire {@link module:state~state.onScheduleChange}
 * so that downstream UI (service selector) stays in sync without
 * creating a circular import.
 */

import { state } from "./state.js";
import { cls, esc, lbl, mkBar } from "./utils.js";

/** @typedef {import("./data.js").ScheduleRow} ScheduleRow */

/**
 * A service (route) grouped within a single conference day.
 *
 * @typedef {object} ServiceGroup
 * @property {string}        name   Service / route name
 * @property {string}        arr    Target arrival time (or "—" for return runs)
 * @property {ScheduleRow[]} buses  Rows belonging to this service
 */

/**
 * All services for a single conference day.
 *
 * @typedef {object} DayGroup
 * @property {string}                   label  Day label (e.g. "7 Sep (Mon)")
 * @property {Map<string,ServiceGroup>} svcs   Services keyed by "svc||arr"
 */

// ── GROUPING ──────────────────────────────────────────────────────────────────

/**
 * Groups flat schedule rows into a nested day → service hierarchy.
 * Insertion order of `Map` preserves the original row ordering.
 *
 * @param {ScheduleRow[]} rows
 * @returns {DayGroup[]}
 */
export function group(rows) {
  /** @type {DayGroup[]} */
  const days = [];
  /** @type {Map<string, DayGroup>} */
  const dayMap = new Map();

  for (const row of rows) {
    if (!dayMap.has(row.day)) {
      const dayGroup = { label: row.day, svcs: new Map() };
      dayMap.set(row.day, dayGroup);
      days.push(dayGroup);
    }
    const dayGroup = /** @type {DayGroup} */ (dayMap.get(row.day));
    const key = `${row.svc}||${row.arr}`;
    if (!dayGroup.svcs.has(key)) {
      dayGroup.svcs.set(key, { name: row.svc, arr: row.arr, buses: [] });
    }
    /** @type {ServiceGroup} */ (dayGroup.svcs.get(key)).buses.push(row);
  }
  return days;
}

// ── FOOTER ────────────────────────────────────────────────────────────────────

/**
 * Builds a `<tfoot>` summary row for a list of bus rows.
 *
 * @param {ScheduleRow[]} buses
 * @returns {string}  HTML `<tr>` string for use inside `<tfoot>`
 */
export function buildFooter(buses) {
  const totalPax = buses.reduce((a, b) => a + b.pax, 0);
  const totalCap = buses.reduce((a, b) => a + b.cap, 0);
  const totalLO = buses.reduce((a, b) => a + (b.lo ?? 0), 0);
  const ratio = totalCap ? totalPax / totalCap : 0;
  const busWord = buses.length === 1 ? "bus" : "buses";
  return (
    `<tr>` +
    `<td colspan="5">${esc(buses.length)} ${busWord} total</td>` +
    `<td style="font-weight:700">${esc(totalPax)}</td>` +
    `<td style="font-weight:700">${esc(totalCap)}</td>` +
    `<td style="font-weight:700">${esc(totalLO)}</td>` +
    `<td>${mkBar(totalPax, totalCap)}</td>` +
    `<td><span class="badge ${cls(ratio)}">${lbl(ratio)}</span></td>` +
    `<td></td>` +
    `</tr>`
  );
}

// ── PARTIAL REFRESH ───────────────────────────────────────────────────────────

/**
 * Refreshes only the capacity bar, status badge and tfoot for a changed row.
 * Avoids a full schedule re-render on every keystroke.
 *
 * @param {HTMLTableRowElement|null} trEl  The `<tr>` whose data changed
 */
export function refreshRowAndFooter(trEl) {
  if (!trEl) return;
  const ridx = Number.parseInt(trEl.dataset.ridx ?? "", 10);
  const row = state.schedule[ridx];
  if (!row) return;

  const ratio = row.cap ? row.pax / row.cap : 0;
  const barCell = trEl.querySelector("[data-bar]");
  const badge = trEl.querySelector(".badge");
  if (barCell) barCell.innerHTML = mkBar(row.pax, row.cap);
  if (badge) {
    badge.className = `badge ${cls(ratio)}`;
    badge.textContent = lbl(ratio);
  }

  const tableEl = trEl.closest("table");
  if (!tableEl) return;
  const siblingRows = Array.from(
    tableEl.querySelectorAll("tbody tr[data-ridx]"),
  )
    .map(
      (tr) =>
        state.schedule[
          Number.parseInt(
            /** @type {HTMLElement} */ (tr).dataset.ridx ?? "",
            10,
          )
        ],
    )
    .filter(Boolean);
  const tfoot = tableEl.querySelector("tfoot");
  if (tfoot)
    tfoot.innerHTML = buildFooter(/** @type {ScheduleRow[]} */ (siblingRows));
}

// ── FULL RENDER ───────────────────────────────────────────────────────────────

/**
 * Renders the full schedule into the `#sched-root` element.
 * Each conference day becomes a labelled `<section>`; each service gets
 * its own editable table.
 */
export function renderSched() {
  const root = document.getElementById("sched-root");
  if (!root) return;
  root.innerHTML = group(state.schedule)
    .map((day, i) => buildDayHtml(day, i))
    .join("");
}

/**
 * Builds the HTML for one conference day.
 *
 * @param {DayGroup} day
 * @param {number}   dayIndex  Used to generate a unique heading ID
 * @returns {string}
 */
function buildDayHtml(day, dayIndex) {
  const headingId = `dh${dayIndex}`;
  const svcsHtml = Array.from(day.svcs.values()).map(buildServiceHtml).join("");
  return (
    `<section aria-labelledby="${headingId}">` +
    `<h2 class="day-h" id="${headingId}">${esc(day.label)}</h2>` +
    `<div class="card">${svcsHtml}</div>` +
    `</section>`
  );
}

/**
 * Builds the HTML for one service (route) table.
 *
 * @param {ServiceGroup} svc
 * @returns {string}
 */
function buildServiceHtml(svc) {
  const arrHtml =
    svc.arr === "\u2014"
      ? ""
      : ` <span style="font-weight:400;text-transform:none">\u2014 arr. by ${esc(svc.arr)}</span>`;
  const rowsHtml = svc.buses.map(buildBusRowHtml).join("");
  const firstBus = svc.buses[0];
  return (
    `<div style="margin-bottom:.75rem">` +
    `<p class="svc-lbl">${esc(svc.name)}${arrHtml}</p>` +
    `<div class="tbl-wrap"><table aria-label="${esc(svc.name)}" style="min-width:760px">` +
    `<thead><tr>` +
    `<th scope="col">Bus / Note</th><th scope="col">From</th><th scope="col">To</th>` +
    `<th scope="col">Dep</th><th scope="col">Arr</th>` +
    `<th scope="col" title="Planned passengers">Pax</th>` +
    `<th scope="col" title="Bus capacity">Cap</th>` +
    `<th scope="col" title="Liaison Officers">LO</th>` +
    `<th scope="col">Fill</th><th scope="col">Status</th>` +
    `<th scope="col"><span class="visually-hidden">Actions</span></th>` +
    `</tr></thead>` +
    `<tbody>${rowsHtml}</tbody>` +
    `<tfoot>${buildFooter(svc.buses)}</tfoot>` +
    `</table></div>` +
    `<button class="btn btn-o btn-sm" type="button"` +
    ` data-add-day="${esc(firstBus.day)}" data-add-svc="${esc(svc.name)}" data-add-arr="${esc(svc.arr)}"` +
    ` style="margin-top:.4rem">+ Add Bus</button>` +
    `</div>`
  );
}

/**
 * Builds the HTML for one editable bus row.
 *
 * @param {ScheduleRow} bus
 * @returns {string}
 */
function buildBusRowHtml(bus) {
  const ridx = state.schedule.indexOf(bus);
  const ratio = bus.cap ? bus.pax / bus.cap : 0;
  return (
    `<tr data-ridx="${ridx}">` +
    `<td>` +
    `<input class="ei ei-id" type="text" value="${esc(bus.id)}" data-f="id" aria-label="Bus ID">` +
    `<input class="ei ei-note" type="text" value="${esc(bus.note)}" data-f="note" placeholder="add note\u2026" aria-label="Note">` +
    `</td>` +
    `<td><input class="ei" type="text" value="${esc(bus.from)}" data-f="from" aria-label="From location"></td>` +
    `<td><input class="ei" type="text" value="${esc(bus.to)}" data-f="to" aria-label="To location"></td>` +
    `<td><input class="ei ei-sm" type="text" value="${esc(bus.dep)}" data-f="dep" aria-label="Departure time"></td>` +
    `<td><input class="ei ei-sm" type="text" value="${esc(bus.arv)}" data-f="arv" aria-label="Arrival time"></td>` +
    `<td><input class="ei ei-num" type="number" value="${esc(bus.pax)}" min="0" max="999" data-f="pax" aria-label="Planned passengers"></td>` +
    `<td><input class="ei ei-num" type="number" value="${esc(bus.cap)}" min="1" max="999" data-f="cap" aria-label="Capacity"></td>` +
    `<td><input class="ei ei-num" type="number" value="${esc(bus.lo ?? 0)}" min="0" max="99" data-f="lo" aria-label="Liaison Officers"></td>` +
    `<td data-bar="${ridx}">${mkBar(bus.pax, bus.cap)}</td>` +
    `<td><span class="badge ${cls(ratio)}">${lbl(ratio)}</span></td>` +
    `<td><button class="btn btn-d btn-sm" type="button" data-rm-ridx="${ridx}" aria-label="Remove bus ${esc(bus.id)}">\u2715</button></td>` +
    `</tr>`
  );
}

// ── EVENT HANDLERS ────────────────────────────────────────────────────────────

/** Fields that require a bar/footer refresh when edited. */
const NUMERIC_FIELDS = new Set(["pax", "cap", "lo"]);

/**
 * Handles `input` events on the schedule table.
 * Numeric fields trigger a lightweight DOM refresh; text fields update state only.
 *
 * @param {Event} event
 */
function onScheduleInput(event) {
  const inp = /** @type {HTMLElement} */ (event.target).closest(
    "input[data-f]",
  );
  if (!inp) return;
  const trEl = /** @type {HTMLTableRowElement|null} */ (
    inp.closest("tr[data-ridx]")
  );
  if (!trEl) return;
  const ridx = Number.parseInt(trEl.dataset.ridx ?? "", 10);
  const row = state.schedule[ridx];
  if (!row) return;

  const field = /** @type {HTMLInputElement} */ (inp).dataset.f ?? "";
  if (NUMERIC_FIELDS.has(field)) {
    /** @type {Record<string,number>} */ (/** @type {unknown} */ (row))[field] =
      Number.parseInt(/** @type {HTMLInputElement} */ (inp).value, 10) || 0;
    refreshRowAndFooter(trEl);
  } else {
    /** @type {Record<string,string>} */ (/** @type {unknown} */ (row))[field] =
      /** @type {HTMLInputElement} */ (inp).value;
  }
}

/**
 * Handles `click` events on the schedule table (remove and add-bus buttons).
 *
 * @param {Event} event
 */
function onScheduleClick(event) {
  const target = /** @type {HTMLElement} */ (event.target);

  const rmBtn = target.closest("[data-rm-ridx]");
  if (rmBtn) {
    const ridx = Number.parseInt(
      /** @type {HTMLElement} */ (rmBtn).dataset.rmRidx ?? "",
      10,
    );
    state.schedule.splice(ridx, 1);
    state.onScheduleChange();
    return;
  }

  const addBtn = target.closest("[data-add-day]");
  if (addBtn) {
    insertBus(/** @type {HTMLElement} */ (addBtn));
    state.onScheduleChange();
  }
}

/**
 * Inserts a new bus row after the last existing bus in the same service.
 *
 * @param {HTMLElement} addBtn  The "+ Add Bus" button element
 */
function insertBus(addBtn) {
  const { addDay: day, addSvc: svc, addArr: arr } = addBtn.dataset;
  if (!day || !svc || !arr) return;
  const existing = state.schedule.filter((r) => r.day === day && r.svc === svc);
  const lastRow = existing.at(-1);
  const insertIdx = lastRow
    ? state.schedule.indexOf(lastRow) + 1
    : state.schedule.length;
  state.schedule.splice(insertIdx, 0, {
    day,
    svc,
    arr,
    id: existing.length + 1,
    from: lastRow?.from ?? "",
    to: lastRow?.to ?? "",
    dep: lastRow?.dep ?? "",
    arv: lastRow?.arv ?? "",
    pax: 0,
    cap: lastRow?.cap ?? 40,
    note: "",
    lo: 0,
  });
}

// ── INIT ──────────────────────────────────────────────────────────────────────

/**
 * Attaches delegated event listeners to `#sched-root`.
 * Must be called once after the initial render.
 */
export function initScheduleEditing() {
  const root = document.getElementById("sched-root");
  if (!root) return;
  root.addEventListener("input", onScheduleInput);
  root.addEventListener("click", onScheduleClick);
}
