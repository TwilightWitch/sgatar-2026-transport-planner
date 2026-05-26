/**
 * @file Shared mutable application state.
 * @module state
 *
 * Centralising all mutable state in one module prevents hidden global
 * side-effects and makes data-flow easy to trace during debugging.
 * Modules that need to mutate state import this object directly;
 * modules that need to react to mutations set {@link state.onScheduleChange}.
 */

import { DEFAULT_SCHEDULE } from "./data.js";

/** @typedef {import("./data.js").ScheduleRow} ScheduleRow */

/**
 * A bus in the custom scenario planner (distinct from a {@link ScheduleRow}).
 *
 * @typedef {object} CustomBus
 * @property {number} id         Auto-incremented identifier
 * @property {string} from       Pickup location
 * @property {string} to         Drop-off location
 * @property {number} capacity   Seat capacity
 * @property {number} plannedPax Planned passenger count
 */

/**
 * The single source of truth for all runtime application state.
 *
 * @type {{
 *   schedule:             ScheduleRow[],
 *   customBuses:          CustomBus[],
 *   customBusIdCounter:   number,
 *   simSeed:              number,
 *   onScheduleChange:     () => void
 * }}
 */
export const state = {
  /** Live schedule rows: mutated by CSV upload, inline edits, add/remove bus. */
  schedule: DEFAULT_SCHEDULE.map((r) => ({ lo: 0, ...r })),

  /** Buses in the custom scenario planner. */
  customBuses: [],

  /** Auto-increment counter for custom bus IDs. */
  customBusIdCounter: 0,

  /**
   * PRNG seed used by the simulator re-randomise feature.
   * Updated on each "Run" click and advanced on each "Re-randomise" click.
   */
  simSeed: 1,

  /**
   * Callback invoked whenever `state.schedule` is structurally mutated
   * (rows added, removed, or replaced via CSV upload).  Set by the
   * application entry point (`app.js`) to trigger both a schedule
   * re-render and a service-selector refresh without creating a circular
   * import dependency between schedule.js and simulator.js.
   */
  onScheduleChange: () => {},
};

/**
 * Resets `state.schedule` to the compiled-in default and fires
 * {@link state.onScheduleChange} to refresh all dependent UI.
 */
export function resetSchedule() {
  state.schedule = DEFAULT_SCHEDULE.map((r) => ({ lo: 0, ...r }));
  state.onScheduleChange();
}
