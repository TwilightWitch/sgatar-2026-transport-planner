"use client";

import { useUpdateHeadcount, type TripWithRoute } from "@/hooks/useLiveFleet";
import { useI18n } from "@/lib/i18n/provider";
import { Minus, Plus } from "lucide-react";

interface HeadcountControlsProps {
  trip: TripWithRoute;
}

function getStatusColor(ratio: number): string {
  if (ratio >= 1) return "text-red-600 dark:text-red-400";
  if (ratio >= 0.8) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

function getBarColor(ratio: number): string {
  if (ratio >= 1) return "bg-red-500";
  if (ratio >= 0.8) return "bg-amber-500";
  return "bg-emerald-500";
}

export function HeadcountControls({ trip }: Readonly<HeadcountControlsProps>) {
  const { t } = useI18n();
  const updateHeadcount = useUpdateHeadcount();

  const handleIncrement = () => {
    updateHeadcount.mutate({
      tripId: trip.id,
      currentPax: trip.currentPax + 1,
    });
  };

  const handleDecrement = () => {
    if (trip.currentPax <= 0) return;
    updateHeadcount.mutate({
      tripId: trip.id,
      currentPax: trip.currentPax - 1,
    });
  };

  const fillRatio =
    trip.maxCapacity > 0 ? trip.currentPax / trip.maxCapacity : 0;
  const fillPercent = Math.min(Math.round(fillRatio * 100), 100);

  return (
    <article
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      aria-label={`${t.headcount} - ${trip.busIdentifier}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {trip.busIdentifier}
        </h3>
        <span className={`text-xl font-bold ${getStatusColor(fillRatio)}`}>
          {trip.currentPax}/{trip.maxCapacity}
        </span>
      </div>

      <p className="mb-3 truncate text-xs text-gray-500 dark:text-gray-400">
        {trip.pickupLocation} → {trip.dropoffLocation}
      </p>

      <progress
        className="mb-4 h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-gray-200 dark:[&::-webkit-progress-bar]:bg-gray-700 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all"
        value={fillPercent}
        max={100}
        aria-label={`${t.capacity}: ${fillPercent}%`}
      >
        {fillPercent}%
      </progress>
      <div
        className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
        aria-hidden="true"
      >
        <div
          className={`h-full rounded-full transition-all ${getBarColor(fillRatio)}`}
          style={{ width: `${fillPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={trip.currentPax <= 0}
          aria-label={t.removePassenger}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-300 bg-red-50 text-red-600 transition-colors hover:bg-red-100 active:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed dark:border-red-700 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
        >
          <Minus className="h-7 w-7" aria-hidden="true" />
        </button>

        <span
          className="text-3xl font-bold text-gray-900 dark:text-white"
          aria-live="polite"
        >
          {trip.currentPax}
        </span>

        <button
          type="button"
          onClick={handleIncrement}
          aria-label={t.addPassenger}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-300 bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100 active:bg-emerald-200 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900"
        >
          <Plus className="h-7 w-7" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
