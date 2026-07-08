"use client";

import { AdhocBusForm } from "@/components/AdhocBusForm";
import { BulkShiftSchedule } from "@/components/BulkShiftSchedule";
import { CsvUpload } from "@/components/CsvUpload";
import { FleetDashboard } from "@/components/FleetDashboard";
import { QuickGuide } from "@/components/QuickGuide";
import { ScheduleEditor } from "@/components/ScheduleEditor";
import { SimulatorPanel } from "@/components/SimulatorPanel";
import { SiteHeader } from "@/components/SiteHeader";
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
    <div className="min-h-screen bg-cream-100 dark:bg-gray-950">
      <SiteHeader maxWidth="max-w-7xl">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-bold text-brand-500">Control Room</p>
            <p className="text-xs text-gray-400">Fleet Operations</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>
      </SiteHeader>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-4 sm:px-6 sm:py-6">
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
                <ScheduleEditor />
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
