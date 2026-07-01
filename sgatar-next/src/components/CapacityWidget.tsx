"use client";

import type { TripWithRoute } from "@/hooks/useLiveFleet";
import { useI18n } from "@/lib/i18n/provider";

interface CapacityWidgetProps {
  trips: TripWithRoute[];
}

function getBarColor(ratio: number): string {
  if (ratio >= 1) return "bg-red-500";
  if (ratio >= 0.8) return "bg-amber-500";
  return "bg-emerald-500";
}

export function CapacityWidget({ trips }: Readonly<CapacityWidgetProps>) {
  const { t } = useI18n();

  const activeTrips = trips.filter((trip) => trip.status !== "completed");

  const totalCapacity = activeTrips.reduce(
    (sum, trip) => sum + trip.maxCapacity,
    0,
  );
  const totalPax = activeTrips.reduce((sum, trip) => sum + trip.currentPax, 0);
  const fillRatio = totalCapacity > 0 ? totalPax / totalCapacity : 0;
  const fillPercent = Math.min(Math.round(fillRatio * 100), 100);
  const barColor = getBarColor(fillRatio);

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
      <progress
        value={fillPercent}
        max={100}
        aria-label={`${fillPercent}% ${t.seatsFilled}`}
        className="sr-only"
      />
      <div
        className="mt-4 h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
        aria-hidden="true"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
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
