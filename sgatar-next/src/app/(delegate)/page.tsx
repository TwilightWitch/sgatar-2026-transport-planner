"use client";

import { DepartureTimeline } from "@/components/DepartureTimeline";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { QuickGuide } from "@/components/QuickGuide";
import { WhatsAppBanner } from "@/components/WhatsAppBanner";
import type { TripWithRoute } from "@/hooks/useLiveFleet";
import { useActiveTrips } from "@/hooks/useLiveFleet";
import { useI18n } from "@/lib/i18n/provider";
import { useState } from "react";

function filterTrips(
  trips: TripWithRoute[],
  location: string,
): TripWithRoute[] {
  if (location === "all") return trips;
  return trips.filter(
    (t) => t.pickupLocation === location || t.dropoffLocation === location,
  );
}

export default function DelegatePage() {
  const { data: trips, isLoading } = useActiveTrips();
  const { t } = useI18n();
  const [filterLocation, setFilterLocation] = useState<string>("all");

  // Extract unique pickup/dropoff locations for the hotel filter
  const locations = trips
    ? [
        ...new Set([
          ...trips.map((t) => t.pickupLocation),
          ...trips.map((t) => t.dropoffLocation),
        ]),
      ].sort((a, b) => a.localeCompare(b))
    : [];

  const filteredTrips = trips ? filterTrips(trips, filterLocation) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.transportSchedule}
        </h2>
        <LanguageSwitcher />
      </div>

      <WhatsAppBanner />

      <QuickGuide
        title={t.quickGuide}
        items={[
          { icon: "🔄", text: t.guideAutoRefresh },
          { icon: "🏨", text: t.guideHotelFilter },
          { icon: "🔴", text: t.guideBusFull },
          { icon: "📱", text: t.guideWhatsApp },
          { icon: "🌐", text: t.guideLanguage },
        ]}
      />

      {/* Hotel/Location filter */}
      {locations.length > 0 && (
        <div>
          <label
            htmlFor="location-filter"
            className="block text-xs font-medium text-gray-600 dark:text-gray-400"
          >
            {t.filterByHotel}
          </label>
          <select
            id="location-filter"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">{t.allLocations}</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading && (
        <output className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <span className="sr-only">Loading transport information...</span>
        </output>
      )}

      {filteredTrips && <DepartureTimeline trips={filteredTrips} />}

      {/* Conference Schedule Placeholder */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t.conferenceSchedule}
        </h2>
        <div className="mt-4 space-y-3">
          <ScheduleDay
            day="7 Sep (Mon)"
            events={["17:00: Welcome Reception at MBS"]}
          />
          <ScheduleDay
            day="8 Sep (Tue)"
            events={[
              "09:00: Opening Ceremony",
              "10:00: Plenary Session",
              "18:45: Opening Dinner at Straits Kitchen",
            ]}
          />
          <ScheduleDay
            day="9 Sep (Wed)"
            events={[
              "09:00: Working Sessions",
              "14:00: Country Presentations",
              "18:15: Night Safari Excursion",
            ]}
          />
          <ScheduleDay
            day="10 Sep (Thu)"
            events={[
              "09:00: Closing Session",
              "14:00: Free and Easy / Shuttle Loop",
              "19:00: Farewell Dinner at MBS",
            ]}
          />
        </div>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          {t.programmePending}
        </p>
      </section>
    </div>
  );
}

function ScheduleDay({
  day,
  events,
}: Readonly<{ day: string; events: string[] }>) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-brand-700 dark:text-brand-200">
        {day}
      </h3>
      <ul className="mt-1 space-y-0.5 pl-3">
        {events.map((ev) => (
          <li key={ev} className="text-sm text-gray-600 dark:text-gray-400">
            {ev}
          </li>
        ))}
      </ul>
    </div>
  );
}
