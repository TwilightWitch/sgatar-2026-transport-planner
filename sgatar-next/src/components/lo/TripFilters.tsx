/**
 * @file TripFilters — LO portal filter toolbar.
 *
 * Provides three orthogonal filters that compose to reduce the number of bus
 * cards visible to the LO:
 * - **Day chips** — pill buttons, one per conference day present in the data.
 * - **Status dropdown** — All | Active (non-completed) | Boarding | Delayed.
 * - **Text search** — free-text match against service name, bus ID, or route.
 *
 * All state is lifted to the parent (lo.tsx) so the parent owns the derived
 * trip list used for rendering.
 */
"use client";

import { Search, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Status filter values available in the dropdown.
 * Values intentionally mirror backend status values to keep filtering explicit.
 */
export type StatusFilter =
  | "all"
  | "scheduled"
  | "boarding"
  | "departed_origin"
  | "en_route"
  | "delayed"
  | "arrived_destination"
  | "completed";

/** Props for {@link TripFilters}. */
export interface TripFiltersProps {
  /** All unique conference days found in the current trip list. */
  days: string[];
  selectedDay: string;
  onDayChange: (day: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (s: StatusFilter) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  /** Total buses before filtering — shown in the results badge. */
  totalCount: number;
  /** Buses visible after all filters are applied. */
  filteredCount: number;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "boarding", label: "Boarding" },
  { value: "departed_origin", label: "Departed Origin" },
  { value: "en_route", label: "En Route" },
  { value: "delayed", label: "Delayed" },
  { value: "arrived_destination", label: "Arrived Destination" },
  { value: "completed", label: "Completed" },
];

const CHIP_BASE =
  "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors min-h-[32px] flex items-center";
const CHIP_ACTIVE = "bg-brand-600 text-white";
const CHIP_INACTIVE =
  "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700";

/**
 * Composed filter toolbar for the LO portal.
 *
 * Renders as a compact stacked layout: day chips on top, status + search below.
 * Shows a result count badge so the LO knows how many buses are visible.
 */
export function TripFilters({
  days,
  selectedDay,
  onDayChange,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchChange,
  totalCount,
  filteredCount,
}: Readonly<TripFiltersProps>) {
  const isFiltered =
    selectedDay !== "all" || statusFilter !== "all" || searchQuery !== "";

  return (
    <section aria-label="Trip filters" className="space-y-2">
      {/* Day chips — only shown when >1 day exists */}
      {days.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label="Filter by conference day"
        >
          <button
            type="button"
            onClick={() => onDayChange("all")}
            className={`${CHIP_BASE} ${selectedDay === "all" ? CHIP_ACTIVE : CHIP_INACTIVE}`}
            aria-pressed={selectedDay === "all"}
          >
            All Days
          </button>
          {days.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => onDayChange(day)}
              className={`${CHIP_BASE} ${selectedDay === day ? CHIP_ACTIVE : CHIP_INACTIVE}`}
              aria-pressed={selectedDay === day}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      {/* Status + search row */}
      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
          aria-label="Filter by status"
          className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <div className="relative flex-1">
          <Search
            className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search bus, route…"
            aria-label="Search trips"
            className="min-h-[40px] w-full rounded-lg border border-gray-300 bg-white py-1 pl-8 pr-8 text-xs text-gray-700 shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-0.5 top-1/2 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Result count — only shown when any filter is active */}
      {isFiltered && (
        <p
          aria-live="polite"
          className="text-xs text-gray-500 dark:text-gray-400"
        >
          Showing{" "}
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {filteredCount}
          </span>{" "}
          of {totalCount} buses
        </p>
      )}
    </section>
  );
}
