"use client";

import { HeadcountControls } from "@/components/HeadcountControls";
import { SosButton } from "@/components/SosButton";
import { useActiveTrips } from "@/hooks/useLiveFleet";

export default function LoPage() {
  const { data: trips, isLoading, error } = useActiveTrips();

  const activeTrips = trips?.filter((trip) => trip.status !== "completed");

  return (
    <div className="space-y-4">
      {isLoading && (
        <output className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <span className="sr-only">Loading assigned trips...</span>
        </output>
      )}

      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
          role="alert"
        >
          Connection lost. Changes will sync when online.
        </div>
      )}

      {activeTrips?.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          No active trips assigned to you.
        </div>
      )}

      {activeTrips?.map((trip) => (
        <div key={trip.id} className="space-y-3">
          <HeadcountControls trip={trip} />
          <SosButton trip={trip} />
        </div>
      ))}
    </div>
  );
}
