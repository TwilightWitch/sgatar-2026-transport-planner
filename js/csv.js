/**
 * @file CSV import and export for the transport schedule.
 * @module csv
 *
 * Handles the full CSV round-trip:
 * - Export: serialises the live schedule to a RFC 4180-compliant CSV download.
 * - Import: parses an uploaded file, validates required columns, and replaces
 *   the live schedule, then fires {@link module:state~state.onScheduleChange}.
 */

import { state } from "./state.js";
import { esc } from "./utils.js";

/** @typedef {import("./data.js").ScheduleRow} ScheduleRow */

/** CSV header row: canonical column order for export and import validation. */
export const CSV_HDR =
  "Day,Service,ArrivalBy,BusId,From,To,Depart,Arrive,PlannedPax,Capacity,Note,LO";

/** Columns that every uploaded CSV must contain. */
const REQUIRED_COLS = [
  "day",
  "service",
  "arrivalby",
  "busid",
  "from",
  "to",
  "depart",
  "arrive",
  "plannedpax",
  "capacity",
  "note",
];

// ── HELPERS ───────────────────────────────────────────────────────────────────

/**
 * Wraps a CSV field value in quotes when it contains commas, quotes or newlines
 * (RFC 4180 §2.6).
 *
 * @param {string|number} value
 * @returns {string}
 */
function qv(value) {
  const s = String(value);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replaceAll('"', '""')}"`
    : s;
}

/**
 * Splits one CSV line into fields, respecting RFC 4180 quoting rules
 * (double-quoted fields may contain commas, and `""` encodes a literal quote).
 *
 * @param {string} line  A single CSV line (no trailing newline)
 * @returns {string[]}   Unquoted field values
 */
function splitLine(line) {
  const cols = [];
  let cur = "";
  let inQ = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === ",") {
      cols.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  cols.push(cur.trim());
  return cols;
}

/**
 * Builds a column-name → index map from a normalised header array.
 *
 * @param {string[]} hdr  Lowercase, whitespace-stripped header tokens
 * @returns {Record<string, number>}
 * @throws {Error} If a required column is absent
 */
function buildColIndex(hdr) {
  /** @type {Record<string, number>} */
  const idx = {};
  for (const col of REQUIRED_COLS) {
    const i = hdr.indexOf(col);
    if (i === -1)
      throw new Error(`Missing column: "${col}". Expected header: ${CSV_HDR}`);
    idx[col] = i;
  }
  return idx;
}

// ── PUBLIC API ────────────────────────────────────────────────────────────────

/**
 * Parses CSV text into an array of {@link ScheduleRow} objects.
 *
 * @param {string} text  Raw CSV file content
 * @returns {ScheduleRow[]}
 * @throws {Error} If the header lacks required columns or no data rows exist
 */
export function parseCSV(text) {
  // Strip UTF-8 BOM (U+FEFF) that some editors prepend to CSV files.
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);}
  if (lines.length < 2)
    throw new Error("CSV must have a header row and at least one data row.");

  const hdr = lines[0]
    .split(",")
    .map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
  const idx = buildColIndex(hdr);
  const loIdx = hdr.indexOf("lo");

  /** @type {ScheduleRow[]} */
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = splitLine(line);
    const day = cols[idx.day] ?? "";
    const svc = cols[idx.service] ?? "";
    if (!day || !svc) continue;

    const pRaw = Number.parseInt(cols[idx.plannedpax] ?? "", 10);
    const cRaw = Number.parseInt(cols[idx.capacity] ?? "", 10);
    const loRaw = loIdx === -1 ? 0 : Number.parseInt(cols[loIdx] ?? "", 10);

    rows.push({
      day,
      svc,
      arr: cols[idx.arrivalby] ?? "\u2014",
      id: cols[idx.busid] ?? String(i),
      from: cols[idx.from] ?? "",
      to: cols[idx.to] ?? "",
      dep: cols[idx.depart] ?? "",
      arv: cols[idx.arrive] ?? "",
      pax: Number.isNaN(pRaw) ? 0 : pRaw,
      cap: Number.isNaN(cRaw) ? 40 : cRaw,
      note: cols[idx.note] ?? "",
      lo: Number.isNaN(loRaw) ? 0 : loRaw,
    });
  }

  if (!rows.length) throw new Error("No valid data rows found.");
  return rows;
}

/**
 * Triggers a browser download of the current schedule as a CSV file.
 */
export function downloadCSV() {
  const csvRows = [
    CSV_HDR,
    ...state.schedule.map((r) =>
      [
        r.day,
        r.svc,
        r.arr,
        r.id,
        r.from,
        r.to,
        r.dep,
        r.arv,
        r.pax,
        r.cap,
        r.note,
        r.lo ?? 0,
      ]
        .map(qv)
        .join(","),
    ),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sgatar-transport-schedule.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}

/**
 * Reads a `File`, parses it as CSV, replaces the live schedule and
 * fires {@link module:state~state.onScheduleChange}.
 * Parse errors are shown inline; file-read errors surface a generic message.
 *
 * @param {File} file
 */
export function handleFile(file) {
  const upSt = document.getElementById("up-st");
  file
    .text()
    .then((text) => {
      try {
        const parsed = parseCSV(text);
        state.schedule = parsed;
        state.onScheduleChange();
        if (upSt) {
          upSt.innerHTML = `<p style="color:var(--c-ok);font-size:.8rem;font-weight:600;margin-top:.35rem">\u2713 Loaded ${esc(parsed.length)} rows from ${esc(file.name)}</p>`;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (upSt) upSt.innerHTML = `<p class="uerr">\u2717 ${esc(msg)}</p>`;
      }
    })
    .catch(() => {
      if (upSt)
        upSt.innerHTML = '<p class="uerr">\u2717 Failed to read file.</p>';
    });
}
