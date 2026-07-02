/**
 * @file MilestoneTracker component — LO milestone progression UI.
 *
 * Renders a linear timeline of trip milestones that an LO can tap to advance
 * the trip's status.  Each milestone button meets the WCAG AA 44×44 px minimum
 * touch target requirement and uses `aria-pressed` to convey the active state.
 *
 * Airport transfer routes receive an additional info block displaying the
 * `flightNumber` and `terminal` so LOs know which flight they are servicing.
 */
"use client";

import type { TripWithRoute } from "@/hooks/useLiveFleet";
import { useUpdateHeadcount } from "@/hooks/useLiveFleet";

// ── Types ────────────────────────────────────────────────────────────────────

/** A single step in the milestone progression timeline. */
interface Milestone {
  /** Status value written to the DB when this milestone is activated. */
  status: TripWithRoute["status"];
  /** Short display label shown on the button. */
  label: string;
  /** Accessible description used by screen readers. */
  description: string;
}

/** Props for {@link MilestoneTracker}. */
interface MilestoneTrackerProps {
  /** The trip whose status this tracker controls. */
  trip: TripWithRoute;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Ordered milestone progression.
 *
 * `delayed` is not included here — it can only be set via the operational
 * notes field to avoid accidental taps.
 */
const MILESTONES: Milestone[] = [
  {
    status: "scheduled",
    label: "Scheduled",
    description: "Trip is scheduled and not yet boarding",
  },
  {
    status: "boarding",
    label: "Boarding",
    description: "Passengers are boarding the bus",
  },
  {
    status: "departed_origin",
    label: "Departed",
    description: "Bus has departed the pickup location",
  },
  {
    status: "arrived_destination",
    label: "Arrived",
    description: "Bus has arrived at the drop-off location",
  },
  {
    status: "completed",
    label: "Completed",
    description: "Trip is complete and closed",
  },
];

/** Maps route types to a human-readable transfer direction label. */
const ROUTE_TYPE_LABEL: Record<string, string> = {
  airport_arrival: "Airport Arrival Transfer",
  airport_departure: "Airport Departure Transfer",
};

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * Renders flight/terminal info for airport transfer routes.
 *
 * @param props.routeType - Discriminator from the route record.
 * @param props.flightNumber - IATA flight number, e.g. "SQ321".
 * @param props.terminal - Airport terminal, e.g. "T3".
 */
function AirportTransferBadge({
  routeType,
  flightNumber,
  terminal,
}: {
  routeType: TripWithRoute["routeType"];
  flightNumber: string | null;
  terminal: string | null;
}) {
  if (!routeType || routeType === "shuttle") return null;
  const typeLabel = ROUTE_TYPE_LABEL[routeType] ?? routeType;

  return (
    <div
      className="flex flex-col gap-1 rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 dark:border-sky-700 dark:bg-sky-950"
      role="note"
      aria-label="Airport transfer details"
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
        {typeLabel}
      </span>
      <div className="flex gap-4 text-sm text-sky-800 dark:text-sky-200">
        {flightNumber && (
          <span>
            <span className="font-medium">Flight:</span> {flightNumber}
          </span>
        )}
        {terminal && (
          <span>
            <span className="font-medium">Terminal:</span> {terminal}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Renders one milestone step button in the timeline.
 *
 * @param props.milestone - The milestone definition.
 * @param props.isActive - Whether this is the current trip status.
 * @param props.isPast - Whether this milestone has already been passed.
 * @param props.onClick - Callback triggered when the button is tapped.
 * @param props.isLoading - Whether a mutation is in-flight (disables button).
 */
function MilestoneStep({
  milestone,
  isActive,
  isPast,
  onClick,
  isLoading,
}: {
  milestone: Milestone;
  isActive: boolean;
  isPast: boolean;
  onClick: () => void;
  isLoading: boolean;
}) {
  const baseClass =
    "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-lg border-2 px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  const stateClass = isActive
    ? "border-brand-600 bg-brand-600 text-white"
    : isPast
      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      : "border-gray-300 bg-white text-gray-500 hover:border-brand-400 hover:text-brand-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400";

  return (
    <button
      type="button"
      aria-pressed={isActive}
      aria-label={milestone.description}
      disabled={isLoading || isPast}
      onClick={onClick}
      className={`${baseClass} ${stateClass}`}
    >
      {isPast && !isActive && (
        <span aria-hidden="true" className="text-base leading-none">
          ✓
        </span>
      )}
      <span>{milestone.label}</span>
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

/**
 * Linear milestone timeline for LO trip status management.
 *
 * Tapping a future milestone advances the trip to that status via
 * `useUpdateHeadcount`.  Past milestones are shown as completed (locked).
 * The current status is visually highlighted.
 *
 * @param props.trip - The live trip record to display and control.
 */
export function MilestoneTracker({ trip }: MilestoneTrackerProps) {
  const updateHeadcount = useUpdateHeadcount();
  const activeIndex = MILESTONES.findIndex((m) => m.status === trip.status);

  function advanceTo(milestone: Milestone, index: number) {
    if (index <= activeIndex) return;
    updateHeadcount.mutate({
      tripId: trip.id,
      currentPax: trip.currentPax,
      status: milestone.status,
    });
  }

  const hasDelegations =
    trip.assignedDelegations && trip.assignedDelegations.length > 0;

  return (
    <div className="space-y-3">
      {/* Delegation badge */}
      {hasDelegations && (
        <div aria-label="Assigned delegations" className="flex flex-wrap gap-1">
          {trip.assignedDelegations!.map((code) => (
            <span
              key={code}
              className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
            >
              {code}
            </span>
          ))}
        </div>
      )}

      {/* Airport transfer info */}
      <AirportTransferBadge
        routeType={trip.routeType}
        flightNumber={trip.flightNumber}
        terminal={trip.terminal}
      />

      {/* Milestone timeline */}
      <div
        aria-label="Trip milestone tracker"
        aria-live="polite"
        className="flex flex-wrap gap-2"
      >
        {MILESTONES.map((milestone, index) => (
          <MilestoneStep
            key={milestone.status}
            milestone={milestone}
            isActive={index === activeIndex}
            isPast={index < activeIndex}
            isLoading={updateHeadcount.isPending}
            onClick={() => advanceTo(milestone, index)}
          />
        ))}
      </div>

      {/* Delayed indicator — shown alongside milestones when applicable */}
      {trip.status === "delayed" && (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
        >
          This trip is currently marked as <strong>delayed</strong>.
        </div>
      )}
    </div>
  );
}
