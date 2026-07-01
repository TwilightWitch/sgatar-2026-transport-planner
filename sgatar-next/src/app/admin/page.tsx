"use client";

import { AdhocBusForm } from "@/components/AdhocBusForm";
import { BulkShiftSchedule } from "@/components/BulkShiftSchedule";
import { CsvUpload } from "@/components/CsvUpload";
import { FleetDashboard } from "@/components/FleetDashboard";
import { ScheduleEditor } from "@/components/ScheduleEditor";
import { SimulatorPanel } from "@/components/SimulatorPanel";
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
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
          role="alert"
        >
          Running in offline mode — edits are stored in memory.
        </div>
      )}

      {trips && (
        <>
          <FleetDashboard trips={trips} />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AdhocBusForm trips={trips} onCreated={handleRefresh} />
            <BulkShiftSchedule trips={trips} onShifted={handleRefresh} />
            <CsvUpload onUploaded={handleRefresh} />
          </div>

          <details className="group">
            <summary className="flex cursor-pointer items-center rounded-lg bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-200">
              <span>Schedule Editor</span>
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({trips.length} trips)
              </span>
            </summary>
            <div className="mt-3">
              <ScheduleEditor trips={trips} onUpdated={handleRefresh} />
            </div>
          </details>

          <details className="group">
            <summary className="cursor-pointer rounded-lg bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-200">
              Demand Simulator
            </summary>
            <div className="mt-3">
              <SimulatorPanel trips={trips} />
            </div>
          </details>
        </>
      )}
    </div>
  );
}
