"use client";

import { DepartureTimeline } from "@/components/DepartureTimeline";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PortalNav } from "@/components/PortalNav";
import { QuickGuide } from "@/components/QuickGuide";
import { WhatsAppBanner } from "@/components/WhatsAppBanner";
import type { TripWithRoute } from "@/hooks/useLiveFleet";
import { useActiveTrips } from "@/hooks/useLiveFleet";
import { useI18n } from "@/lib/i18n/provider";
import { useEffect, useState } from "react";

// ── Conference schedule data ────────────────────────────────────────────────

interface AgendaItem {
  time: string;
  title: string;
  venue?: string;
  dress?: string;
  transport?: string;
  note?: string;
}

interface ConfDay {
  label: string;
  date: string;
  items: AgendaItem[];
}

const CONF_SCHEDULE: ConfDay[] = [
  {
    label: "Day 0",
    date: "7 Sep (Mon)",
    items: [
      { time: "13:00–17:30", title: "Arrival of Delegates and Registration" },
      {
        time: "17:30–20:00",
        title: "Welcome Reception",
        venue: "MBS Orchid Ballroom",
        dress: "Smart Casual",
        transport:
          "Two-way transport: Rendezvous / Parkroyal Marina Bay ↔ MBS (buses 16:30–16:40)",
      },
    ],
  },
  {
    label: "Day 1",
    date: "8 Sep (Tue)",
    items: [
      {
        time: "08:00–08:15",
        title: "Hotel buses depart for MBS",
        transport: "Buses from Rendezvous / Parkroyal Marina Bay → MBS",
      },
      {
        time: "09:30–10:00",
        title: "SGATAR Opening Ceremony",
        venue: "MBS Melati Ballroom",
        dress: "Business Attire",
      },
      {
        time: "10:45–11:15",
        title: "Plenary Session",
        venue: "MBS Melati Ballroom",
        dress: "Business Attire",
      },
      {
        time: "11:15–18:00",
        title: "HOD Forum / Working Group Sessions",
        venue: "MBS Orchid Ballroom",
        dress: "Business Attire",
        note: "Delegates not in sessions have free time",
      },
      {
        time: "18:05–18:20",
        title: "Buses depart MBS for Opening Dinner",
        transport: "7 buses MBS → Straits Kitchen, Grand Hyatt",
      },
      {
        time: "18:45–21:30",
        title: "Opening Dinner",
        venue: "Straits Kitchen, Grand Hyatt",
        dress: "Business Attire",
        transport: "Return transport to MBS / Hotels after dinner",
      },
    ],
  },
  {
    label: "Day 2",
    date: "9 Sep (Wed)",
    items: [
      {
        time: "08:00–08:15",
        title: "Hotel buses depart for MBS",
        transport: "Buses from Rendezvous / Parkroyal Marina Bay → MBS",
      },
      {
        time: "09:00–13:00",
        title: "HOD Forum / Working Group Sessions",
        venue: "MBS Orchid Ballroom",
        dress: "Business Attire",
        note: "Delegates not in sessions have free time",
      },
      {
        time: "13:00–14:30",
        title: "Lunch",
        venue: "MBS Melati Ballroom F&B Rooms",
        dress: "Business Attire",
      },
      {
        time: "14:30–17:00",
        title: "Afternoon Sessions / Free Time",
        dress: "Business Attire",
      },
      {
        time: "17:00–17:40",
        title: "Buses depart for Night Safari",
        transport:
          "Buses from Rendezvous / Parkroyal Marina Bay / MBS → Night Safari",
      },
      {
        time: "17:30–22:30",
        title: "Social Programme + Dinner",
        venue: "Night Safari",
        dress: "Casual and comfortable attire",
        transport: "Return transport Night Safari → Hotels (~21:30 onwards)",
      },
    ],
  },
  {
    label: "Day 3",
    date: "10 Sep (Thu)",
    items: [
      {
        time: "08:30–08:45",
        title: "Hotel buses depart for MBS",
        transport: "Buses from Rendezvous / Parkroyal Marina Bay → MBS",
      },
      {
        time: "09:30–10:30",
        title: "Presentation by Special Guests",
        venue: "MBS Melati Ballroom",
        dress: "Business Attire",
      },
      {
        time: "11:00–13:00",
        title: "Plenary Session + Closing Ceremony",
        venue: "MBS Melati Ballroom",
        dress: "Business Attire",
      },
      {
        time: "13:00–14:00",
        title: "Lunch",
        venue: "MBS Melati Ballroom F&B Rooms",
      },
      {
        time: "17:30–23:00",
        title: "SGATAR Night",
        venue: "MBS Melati Ballroom",
        dress: "Casual and comfortable attire",
        transport: "Return transport MBS → Hotels (~23:00 onwards)",
      },
    ],
  },
  {
    label: "Day 4",
    date: "11 Sep (Fri)",
    items: [{ time: "All day", title: "Departure of Delegates" }],
  },
];

// ── Dress code badge ────────────────────────────────────────────────────────

function DressBadge({ dress }: Readonly<{ dress: string }>) {
  const styles: Record<string, string> = {
    "Smart Casual":
      "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    "Business Attire":
      "bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    "Casual and comfortable attire":
      "bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  };
  const cls =
    styles[dress] ??
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${cls}`}
    >
      {dress}
    </span>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function filterTrips(
  trips: TripWithRoute[],
  location: string,
): TripWithRoute[] {
  if (location === "all") return trips;
  return trips.filter(
    (t) => t.pickupLocation === location || t.dropoffLocation === location,
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DelegatePage() {
  const { data: trips, isLoading } = useActiveTrips();
  const { t } = useI18n();

  // Day tabs – derived from live trip data
  const days = trips
    ? [...new Set(trips.map((tr) => tr.conferenceDay))].sort(
        (a, b) => parseInt(a, 10) - parseInt(b, 10),
      )
    : [];

  const [selectedDay, setSelectedDay] = useState<string>("");
  const [filterLocation, setFilterLocation] = useState<string>("all");

  // Default to the first day once data loads
  useEffect(() => {
    if (days.length > 0 && !selectedDay) {
      setSelectedDay(days[0]);
    }
  }, [days, selectedDay]);

  // Reset hotel filter whenever the day tab changes
  const handleDayChange = (day: string) => {
    setSelectedDay(day);
    setFilterLocation("all");
  };

  const dayTrips =
    trips?.filter((tr) => tr.conferenceDay === selectedDay) ?? [];

  const locationsForDay = [
    ...new Set([
      ...dayTrips.map((tr) => tr.pickupLocation),
      ...dayTrips.map((tr) => tr.dropoffLocation),
    ]),
  ].sort((a, b) => a.localeCompare(b));

  const filteredTrips = filterTrips(dayTrips, filterLocation);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-brand-700 bg-brand-900 px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-lg font-bold text-white">SGATAR 2026</h1>
          <PortalNav />
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {/* Top bar */}
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
            {
              icon: "📅",
              text: "Select a conference day tab to see that day's buses.",
            },
            { icon: "🏨", text: t.guideHotelFilter },
            { icon: "🔴", text: t.guideBusFull },
            { icon: "📱", text: t.guideWhatsApp },
          ]}
        />

        {/* ── Transport section ─────────────────────────────────────────── */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          {/* Day tabs */}
          {days.length > 0 && (
            <div className="flex overflow-x-auto border-b border-gray-200 px-4 pt-4 dark:border-gray-700">
              {days.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayChange(day)}
                  className={`mr-1 shrink-0 rounded-t-lg px-4 py-2 text-xs font-medium transition-colors ${
                    selectedDay === day
                      ? "border-b-2 border-brand-600 bg-white text-brand-700 dark:border-brand-400 dark:bg-gray-900 dark:text-brand-300"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4 p-4">
            {/* Hotel filter */}
            {locationsForDay.length > 1 && (
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
                  {locationsForDay.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isLoading && (
              <output className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
                <span className="sr-only">
                  Loading transport information...
                </span>
              </output>
            )}

            {!isLoading && selectedDay && filteredTrips.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No departures scheduled for this day and location.
              </p>
            )}

            {filteredTrips.length > 0 && (
              <DepartureTimeline trips={filteredTrips} />
            )}
          </div>
        </section>

        {/* ── Conference schedule ────────────────────────────────────────── */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t.conferenceSchedule}
            </h2>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {CONF_SCHEDULE.map((day) => (
              <details key={day.date} className="group">
                <summary className="flex cursor-pointer items-center gap-3 px-6 py-4 [&::-webkit-details-marker]:hidden">
                  <svg
                    className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-90"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {day.label}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      {day.date}
                    </span>
                  </div>
                </summary>

                <ol className="space-y-3 px-6 pb-4 pt-1">
                  {day.items.map((item) => (
                    <li key={item.time + item.title} className="flex gap-3">
                      <time className="mt-0.5 w-24 shrink-0 text-xs font-mono text-gray-500 dark:text-gray-400">
                        {item.time}
                      </time>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.title}
                        </p>
                        {item.venue && (
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            📍 {item.venue}
                          </p>
                        )}
                        {item.transport && (
                          <p className="mt-0.5 text-xs text-brand-600 dark:text-brand-300">
                            🚌 {item.transport}
                          </p>
                        )}
                        {item.note && (
                          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 italic">
                            {item.note}
                          </p>
                        )}
                        {item.dress && (
                          <div className="mt-1">
                            <DressBadge dress={item.dress} />
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </details>
            ))}
          </div>

          <p className="border-t border-gray-100 px-6 py-3 text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
            {t.programmePending}
          </p>
        </section>
      </main>
    </div>
  );
}
