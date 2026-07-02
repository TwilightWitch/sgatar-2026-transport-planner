"use client";

import { HeadcountControls } from "@/components/HeadcountControls";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { MilestoneTracker } from "@/components/lo/MilestoneTracker";
import { PortalNav } from "@/components/PortalNav";
import { QuickGuide } from "@/components/QuickGuide";
import { SosButton } from "@/components/SosButton";
import { useActiveTrips } from "@/hooks/useLiveFleet";
import { useI18n } from "@/lib/i18n/provider";
import { useState } from "react";

export default function LoPage() {
  const { data: trips, isLoading, error } = useActiveTrips();
  const { t } = useI18n();
  const [filterDay, setFilterDay] = useState<string>("all");

  const activeTrips =
    trips?.filter((trip) => trip.status !== "completed") ?? [];
  const days = [...new Set(activeTrips.map((tr) => tr.conferenceDay))];
  const filtered =
    filterDay === "all"
      ? activeTrips
      : activeTrips.filter((tr) => tr.conferenceDay === filterDay);

  const grouped = filtered.reduce<Record<string, typeof filtered>>(
    (acc, trip) => {
      const key = `${trip.conferenceDay}: ${trip.serviceName}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(trip);
      return acc;
    },
    {},
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-brand-700 bg-brand-900 px-4 py-3">
        <div className="mx-auto flex max-w-lg flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-bold text-white">LO Portal</h1>
          <PortalNav />
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        <QuickGuide
          title={t.loQuickGuide}
          items={[
            { icon: "➕", text: t.guideLoIncrement },
            { icon: "🔢", text: t.guideLoTypeCount },
            { icon: "↔️", text: t.guideLoSlider },
            { icon: "🔴", text: t.guideLoSos },
            { icon: "📶", text: t.guideLoOffline },
          ]}
        />

        {isLoading && (
          <output className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <span className="sr-only">Loading assigned trips...</span>
          </output>
        )}

        {error && (
          <div
            className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
            role="alert"
          >
            Connection lost — retrying automatically.
            {process.env.NODE_ENV === "development" && (
              <span className="ml-1 opacity-60">
                ({error instanceof Error ? error.message : "unknown error"})
              </span>
            )}
          </div>
        )}

        {days.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setFilterDay("all")}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterDay === "all"
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              All Days
            </button>
            {days.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setFilterDay(day)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filterDay === day
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        )}

        {activeTrips.length === 0 && !isLoading && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            No active trips assigned.
          </div>
        )}

        {Object.entries(grouped).map(([service, serviceTrips]) => (
          <details key={service} className="group" open>
            <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
              <span>{service}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {serviceTrips.length} bus{serviceTrips.length === 1 ? "" : "es"}
              </span>
            </summary>
            <div className="mt-2 space-y-3 pl-1">
              {serviceTrips.map((trip) => (
                <div key={trip.id} className="space-y-2">
                  <MilestoneTracker trip={trip} />
                  <HeadcountControls trip={trip} />
                  <SosButton trip={trip} />
                </div>
              ))}
            </div>
          </details>
        ))}
      </main>
    </div>
  );
}
