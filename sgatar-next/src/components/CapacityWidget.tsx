"use client";

import { useI18n } from "@/lib/i18n/provider";
import type { TripWithRoute } from "@/hooks/useLiveFleet";

interface CapacityWidgetProps {
  trips: TripWithRoute[];
}

export function CapacityWidget({ trips }: CapacityWidgetProps) {
  const { t } = useI18n();

  const activeTrips = trips.filter(
    (trip) => trip.status !== "completed"
  );

  const totalCapacity = activeTrips.reduce(
    (sum, trip) => sum + trip.maxCapacity,
    0
  );
  const totalPax = activeTrips.reduce(
    (sum, trip) => sum + trip.currentPax,
    0
  );
  const fillRatio = totalCapacity > 0 ? totalPax / totalCapacity : 0;
  const fillPercent = Math.min(Math.round(fillRatio * 100), 100);

  const statusColor =
    fillRatio >= 1
      ? "bg-red-500 dark:bg-red-600"
      : fillRatio >= 0.8
        ? "bg-amber-500 dark:bg-amber-600"
        : "bg-emerald-500 dark:bg-emerald-600";

  return (
    <section
      aria-label="Fleet capacity overview"
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
    >
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {totalPax} / {totalCapacity} {t.seatsFilled}
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {totalCapacity - totalPax} {t.seatsAvailable}
      </p>
      <div
        className="mt-4 h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
        role="progressbar"
        aria-valuenow={fillPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${fillPercent}% ${t.seatsFilled}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${statusColor}`}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{activeTrips.length} active buses</span>
        <span>{fillPercent}%</span>
      </div>
    </section>
  );
}
