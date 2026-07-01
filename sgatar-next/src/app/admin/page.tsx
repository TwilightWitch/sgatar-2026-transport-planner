"use client";

import { AdhocBusForm } from "@/components/AdhocBusForm";
import { BulkShiftSchedule } from "@/components/BulkShiftSchedule";
import { FleetDashboard } from "@/components/FleetDashboard";
import { useActiveTrips } from "@/hooks/useLiveFleet";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminPage() {
  const { data: trips, isLoading, error } = useActiveTrips();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["activeTrips"] }).catch(() => {
      // Silently retry on next poll cycle
    });
  };

  return (
    <div className="space-y-6">
      {isLoading && (
        <output className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <span className="sr-only">Loading fleet data...</span>
        </output>
      )}

      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
          role="alert"
        >
          Failed to connect to dispatch system. Retrying...
        </div>
      )}

      {trips && (
        <>
          <FleetDashboard trips={trips} />

          <div className="grid gap-6 md:grid-cols-2">
            <AdhocBusForm trips={trips} onCreated={handleRefresh} />
            <BulkShiftSchedule trips={trips} onShifted={handleRefresh} />
          </div>
        </>
      )}
    </div>
  );
}
