/**
 * @file MilestoneTracker — LO trip status selector.
 *
 * Simple pill-based radio group. The selected status is highlighted; tapping
 * another pill calls `onDraftStatusChange` (BusCard draft mode) or fires the
 * mutation directly (standalone mode). All statuses including Delayed are
 * selectable so LOs can correct mistakes freely.
 */
"use client";

import { useUpdateHeadcount, type TripWithRoute } from "@/hooks/useLiveFleet";

const STATUS_OPTIONS: { status: TripWithRoute["status"]; label: string }[] = [
  { status: "scheduled", label: "Scheduled" },
  { status: "boarding", label: "Boarding" },
  { status: "departed_origin", label: "Departed" },
  { status: "arrived_destination", label: "Arrived" },
  { status: "delayed", label: "Delayed" },
  { status: "completed", label: "Completed" },
];

const ROUTE_TYPE_LABEL: Record<string, string> = {
  airport_arrival: "Airport Arrival",
  airport_departure: "Airport Departure",
};

interface MilestoneTrackerProps {
  trip: TripWithRoute;
  /** Draft mode — parent controls the displayed status (used by BusCard). */
  draftStatus?: TripWithRoute["status"];
  /** Required when `draftStatus` is provided. */
  onDraftStatusChange?: (s: TripWithRoute["status"]) => void;
}

/**
 * Status pill picker for the LO portal.
 *
 * @param props.trip - The trip record to display and control.
 * @param props.draftStatus - Overrides the displayed status in draft mode.
 * @param props.onDraftStatusChange - Called instead of mutating in draft mode.
 */
export function MilestoneTracker({
  trip,
  draftStatus,
  onDraftStatusChange,
}: Readonly<MilestoneTrackerProps>) {
  const updateHeadcount = useUpdateHeadcount();
  const current = draftStatus ?? trip.status;

  function select(status: TripWithRoute["status"]) {
    if (status === current) return;
    if (onDraftStatusChange) {
      onDraftStatusChange(status);
    } else {
      updateHeadcount.mutate({
        tripId: trip.id,
        currentPax: trip.currentPax,
        status,
      });
    }
  }

  const isAirport = trip.routeType && trip.routeType !== "shuttle";

  return (
    <div className="space-y-2">
      {/* Delegation badges */}
      {trip.assignedDelegations?.length ? (
        <div className="flex flex-wrap gap-1" aria-label="Assigned delegations">
          {trip.assignedDelegations.map((code) => (
            <span
              key={code}
              className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
            >
              {code}
            </span>
          ))}
        </div>
      ) : null}

      {/* Airport metadata */}
      {isAirport && (
        <div
          className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs text-sky-800 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-200"
          role="note"
        >
          <span className="font-semibold">
            {ROUTE_TYPE_LABEL[trip.routeType!] ?? trip.routeType}
          </span>
          {trip.flightNumber && (
            <span className="ml-2">· {trip.flightNumber}</span>
          )}
          {trip.terminal && <span className="ml-2">· {trip.terminal}</span>}
        </div>
      )}

      {/* Status pills */}
      <div
        role="group"
        aria-label="Trip status"
        aria-live="polite"
        className="flex flex-wrap gap-1.5"
      >
        {STATUS_OPTIONS.map(({ status, label }) => {
          const isSelected = status === current;
          return (
            <button
              key={status}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={updateHeadcount.isPending}
              onClick={() => select(status)}
              className={`min-h-[36px] rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                isSelected
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-gray-300 bg-white text-gray-600 hover:border-brand-400 hover:text-brand-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
3