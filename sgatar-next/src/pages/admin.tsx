"use client";

import { AdhocBusForm } from "@/components/AdhocBusForm";
import { BulkShiftSchedule } from "@/components/BulkShiftSchedule";
import { CsvUpload } from "@/components/CsvUpload";
import { FleetDashboard } from "@/components/FleetDashboard";
import { PortalNav } from "@/components/PortalNav";
import { QuickGuide } from "@/components/QuickGuide";
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <header className="border-b border-brand-700 bg-brand-900 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Control Room</h1>
            <p className="text-xs text-white/75">
              SGATAR 2026 Fleet Operations
            </p>
          </div>
          <div className="flex items-center gap-4">
            <PortalNav />
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
              </span>
              <span className="text-xs text-white/75">Live</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <QuickGuide
          title="Control Room Quick Reference"
          items={[
            {
              icon: "🚨",
              text: "Fleet Dashboard: SOS alerts flash red at the top. The table shows every active bus with live headcount, status, and flags.",
            },
            {
              icon: "🚌",
              text: "Add Ad-Hoc Bus: Deploy an unplanned ghost bus on an existing route when demand exceeds capacity.",
            },
            {
              icon: "⏱️",
              text: "Bulk Delay: Apply a delay (in minutes) to all buses on a route at once, or tap Clear Delay to reset their status to Scheduled.",
            },
            {
              icon: "✏️",
              text: "Schedule Editor: Click any cell to edit it inline. Use the day filter chips to focus on a single conference day.",
            },
            {
              icon: "📊",
              text: "Simulator: Model how many buses are needed for a given guest count and variability before the event.",
            },
            {
              icon: "📄",
              text: "CSV Upload: Bulk-update or add trips from a spreadsheet. See the column reference table for the correct header names.",
            },
          ]}
        />

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
      </main>
    </div>
  );
}
