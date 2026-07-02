/**
 * @file DepartureTimeline component.
 *
 * Delegate portal section listing the next 10 upcoming departures in
 * chronological order.  Each row shows:
 * - Scheduled departure time (12-hour AM/PM format).
 * - Service name and pickup → dropoff route.
 * - Live status badge (Scheduled / Boarding / Delayed).
 * - Current pax vs capacity, with a "Full" badge when the bus is at capacity.
 *
 * Only trips with status `scheduled`, `boarding`, or `delayed` are shown.
 * The list is re-rendered every time the parent page receives a fresh poll
 * from {@link useActiveTrips}.
 */
"use client";

import type { TripWithRoute } from "@/hooks/useLiveFleet";
import { useI18n } from "@/lib/i18n/provider";
import { Clock, MapPin } from "lucide-react";

interface DepartureTimelineProps {
  trips: TripWithRoute[];
}

export function DepartureTimeline({ trips }: Readonly<DepartureTimelineProps>) {
  const { t } = useI18n();

  const upcoming = trips
    .filter(
      (trip) =>
        trip.status === "scheduled" ||
        trip.status === "boarding" ||
        trip.status === "delayed",
    )
    .sort((a, b) => a.scheduledDeparture.localeCompare(b.scheduledDeparture))
    .slice(0, 10);

  const statusStyles: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    boarding:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    delayed:
      "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    en_route:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    departed_origin:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    arrived_destination:
      "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
    completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  };

  /** Human-readable label for each trip status — does not depend on i18n keys. */
  const statusLabel: Record<TripWithRoute["status"], string> = {
    scheduled: t.scheduled,
    boarding: t.boarding,
    en_route: t.enRoute,
    delayed: t.delayed,
    completed: t.completed,
    departed_origin: "Departed",
    arrived_destination: "Arrived",
  };

  if (upcoming.length === 0) {
    return (
      <section
        aria-label={t.nextDepartures}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t.nextDepartures}
        </h2>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {t.noTripsAvailable}
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label={t.nextDepartures}
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
    >
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        {t.nextDepartures}
      </h2>
      <ol className="space-y-3" aria-label="Departure timeline">
        {upcoming.map((trip) => (
          <li
            key={trip.id}
            className="flex items-center gap-4 rounded-lg border border-gray-100 p-3 dark:border-gray-700"
          >
            <div className="flex flex-col items-center">
              <Clock
                className="h-4 w-4 text-gray-500 dark:text-gray-400"
                aria-hidden="true"
              />
              <time className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                {trip.scheduledDeparture}
              </time>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {trip.serviceName}
              </p>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                <span>
                  {trip.pickupLocation} → {trip.dropoffLocation}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[trip.status] ?? statusStyles.scheduled}`}
              >
                {statusLabel[trip.status]}
              </span>
              {trip.currentPax >= trip.maxCapacity ? (
                <span
                  className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900 dark:text-red-300"
                  aria-label="Bus full"
                >
                  Full
                </span>
              ) : (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {trip.currentPax}/{trip.maxCapacity}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
