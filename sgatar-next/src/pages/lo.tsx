"use client";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BusCard } from "@/components/lo/BusCard";
import { TripFilters, type StatusFilter } from "@/components/lo/TripFilters";
import { QuickGuide } from "@/components/QuickGuide";
import { SiteHeader } from "@/components/SiteHeader";
import { useActiveTrips, type TripWithRoute } from "@/hooks/useLiveFleet";
import { useI18n } from "@/lib/i18n/provider";
import { useState } from "react";

// ── Filter logic (pure functions, easy to unit-test) ──────────────────────────

/**
 * Applies the status dropdown filter to a list of trips.
 * `"active"` excludes completed; the others match the exact DB status string.
 */
function applyStatusFilter(
  trips: TripWithRoute[],
  filter: StatusFilter,
): TripWithRoute[] {
  if (filter === "all") return trips;
  if (filter === "active") return trips.filter((t) => t.status !== "completed");
  return trips.filter((t) => t.status === filter);
}

/**
 * Case-insensitive substring search across service name, bus ID, and route.
 * Returns the original array unchanged when the query is blank.
 */
function applySearch(trips: TripWithRoute[], query: string): TripWithRoute[] {
  const q = query.trim().toLowerCase();
  if (!q) return trips;
  return trips.filter(
    (t) =>
      t.serviceName.toLowerCase().includes(q) ||
      t.busIdentifier.toLowerCase().includes(q) ||
      t.pickupLocation.toLowerCase().includes(q) ||
      t.dropoffLocation.toLowerCase().includes(q),
  );
}

/** Groups a flat trip list by `"conferenceDay: serviceName"` heading key. */
function groupByService(
  trips: TripWithRoute[],
): Record<string, TripWithRoute[]> {
  return trips.reduce<Record<string, TripWithRoute[]>>((acc, trip) => {
    const key = `${trip.conferenceDay}: ${trip.serviceName}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(trip);
    return acc;
  }, {});
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoPage() {
  const { data: trips, isLoading, error } = useActiveTrips();
  const { t } = useI18n();

  const [filterDay, setFilterDay] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [searchQuery, setSearchQuery] = useState("");

  // Build derived data — all filtering is stateless transforms on the cache
  const allTrips = trips ?? [];
  const days = [...new Set(allTrips.map((tr) => tr.conferenceDay))];

  const byDay =
    filterDay === "all"
      ? allTrips
      : allTrips.filter((t) => t.conferenceDay === filterDay);

  const byStatus = applyStatusFilter(byDay, statusFilter);
  const filtered = applySearch(byStatus, searchQuery);
  const grouped = groupByService(filtered);

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-gray-950">
      {/* Header uses default max-w-4xl so logo + ThemeToggle + PortalNav
          have full breathing room on desktop without overflow. */}
      <SiteHeader />

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
            {
              icon: "✅",
              text: "Tap Confirm to save headcount and milestone changes.",
            },
            { icon: "🔴", text: t.guideLoSos },
            { icon: "📶", text: t.guideLoOffline },
          ]}
        />

        <TripFilters
          days={days}
          selectedDay={filterDay}
          onDayChange={setFilterDay}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalCount={allTrips.length}
          filteredCount={filtered.length}
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

        {filtered.length === 0 && !isLoading && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            {allTrips.length === 0
              ? "No active trips assigned."
              : "No buses match the current filters."}
          </div>
        )}

        {Object.entries(grouped).map(([service, serviceTrips]) => (
          <details key={service} className="group" open>
            <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-gray-800 dark:text-gray-200">
              <span>{service}</span>
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                {serviceTrips.length} bus{serviceTrips.length === 1 ? "" : "es"}
              </span>
            </summary>
            <div className="mt-2 space-y-3 pl-1">
              {serviceTrips.map((trip) => (
                <BusCard key={trip.id} trip={trip} />
              ))}
            </div>
          </details>
        ))}
      </main>
    </div>
  );
}
