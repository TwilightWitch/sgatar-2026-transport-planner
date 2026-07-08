/**
 * @file PersonalizedFleet — Delegate wayfinding component.
 *
 * Provides a country selector, route-type tabs (Daily Shuttles / Airport Transfers),
 * and a live personalised bus feed filtered to the delegate's country via
 * {@link useDelegateFleet}.  Pickup instructions are shown prominently so delegates
 * know exactly where to go.
 *
 * Country selection is persisted to `localStorage` under the key
 * `"sgatar_delegate_country"` so the preference survives page refreshes.
 *
 * All interactive elements meet WCAG AA 44×44 px touch targets.
 */
"use client";

import { TripStepper } from "@/components/delegate/TripStepper";
import type { TripWithRoute } from "@/hooks/useLiveFleet";
import { useDayFilteredFleet } from "@/hooks/useLiveFleet";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const LS_COUNTRY_KEY = "sgatar_delegate_country";

/**
 * Member economies attending SGATAR 2026.
 * Codes follow ISO 3166-1 alpha-3 for consistency with `assignedDelegations`.
 */
const DELEGATE_COUNTRIES: { code: string; name: string }[] = [
  { code: "AUS", name: "Australia" },
  { code: "BGD", name: "Bangladesh" },
  { code: "BRN", name: "Brunei" },
  { code: "CHN", name: "China" },
  { code: "HKG", name: "Hong Kong, China" },
  { code: "IND", name: "India" },
  { code: "IDN", name: "Indonesia" },
  { code: "JPN", name: "Japan" },
  { code: "KOR", name: "Korea" },
  { code: "MAC", name: "Macao, China" },
  { code: "MYS", name: "Malaysia" },
  { code: "MDV", name: "Maldives" },
  { code: "MNG", name: "Mongolia" },
  { code: "MMR", name: "Myanmar" },
  { code: "NPL", name: "Nepal" },
  { code: "NZL", name: "New Zealand" },
  { code: "PAK", name: "Pakistan" },
  { code: "PNG", name: "Papua New Guinea" },
  { code: "PHL", name: "Philippines" },
  { code: "SGP", name: "Singapore" },
  { code: "LKA", name: "Sri Lanka" },
  { code: "TWN", name: "Chinese Taipei" },
  { code: "THA", name: "Thailand" },
  { code: "VNM", name: "Vietnam" },
];

/** Route-type tab identifiers. */
type RouteTab = "shuttle" | "airport";

// ── Sub-components ─────────────────────────────────────────────────────────────

/**
 * Accessible country selector with 44px touch targets.
 *
 * @param props.value - Currently selected country code, or empty string.
 * @param props.onChange - Called when a new country is selected.
 */
function CountrySelector({
  value,
  onChange,
}: Readonly<{
  value: string;
  onChange: (code: string) => void;
}>) {
  return (
    <div className="space-y-1">
      <label
        htmlFor="delegate-country"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Your delegation
      </label>
      <select
        id="delegate-country"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        aria-label="Select your delegation country"
      >
        <option value="">All delegations (general pool)</option>
        {DELEGATE_COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Conference day selector backed by the shared day-filtered hook.
 */
function DaySelector({
  value,
  days,
  onChange,
}: Readonly<{
  value: string;
  days: string[];
  onChange: (day: string) => void;
}>) {
  return (
    <div className="space-y-1">
      <label
        htmlFor="delegate-day"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Conference day
      </label>
      <select
        id="delegate-day"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        aria-label="Select conference day"
      >
        <option value="">All days</option>
        {days.map((day) => (
          <option key={day} value={day}>
            {day}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Segmented tab control for switching between shuttle and airport transfer views.
 *
 * @param props.active - The currently active tab.
 * @param props.onChange - Called when a tab is selected.
 * @param props.shuttleCount - Count badge for shuttle trips.
 * @param props.airportCount - Count badge for airport trips.
 */
function RouteTypeTabs({
  active,
  onChange,
  shuttleCount,
  airportCount,
}: Readonly<{
  active: RouteTab;
  onChange: (tab: RouteTab) => void;
  shuttleCount: number;
  airportCount: number;
}>) {
  const tabClass = (tab: RouteTab) =>
    `flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active === tab
        ? "bg-brand-600 text-white shadow"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
    }`;

  return (
    <div role="tablist" aria-label="Route type filter" className="flex gap-2">
      <button
        role="tab"
        type="button"
        aria-selected={active === "shuttle"}
        onClick={() => onChange("shuttle")}
        className={tabClass("shuttle")}
      >
        <span aria-hidden="true">🚌</span>
        <span>Daily Shuttles</span>
        {shuttleCount > 0 && (
          <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-bold">
            {shuttleCount}
          </span>
        )}
      </button>
      <button
        role="tab"
        type="button"
        aria-selected={active === "airport"}
        onClick={() => onChange("airport")}
        className={tabClass("airport")}
      >
        <span aria-hidden="true">✈️</span>
        <span>Airport Transfers</span>
        {airportCount > 0 && (
          <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-bold">
            {airportCount}
          </span>
        )}
      </button>
    </div>
  );
}

/**
 * Single trip card rendered in the delegate personalised feed.
 *
 * Displays departure time, route name, status badge, seat availability,
 * and — for airport transfers — the flight number, terminal, and pickup
 * instructions.
 *
 * @param props.trip - The trip to display.
 */
function TripCard({ trip }: Readonly<{ trip: TripWithRoute }>) {
  const isAirport =
    trip.routeType === "airport_arrival" ||
    trip.routeType === "airport_departure";
  const seatsLeft = trip.maxCapacity - trip.currentPax;
  const occupancyPct = Math.round((trip.currentPax / trip.maxCapacity) * 100);

  const statusColor: Record<TripWithRoute["status"], string> = {
    scheduled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    boarding:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
    departed_origin:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200",
    en_route:
      "bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200",
    delayed:
      "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
    arrived_destination:
      "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200",
    completed: "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
  };

  const statusLabel: Record<TripWithRoute["status"], string> = {
    scheduled: "Scheduled",
    boarding: "Now Boarding",
    departed_origin: "Departed",
    en_route: "En Route",
    delayed: "Delayed",
    arrived_destination: "Arrived",
    completed: "Completed",
  };

  return (
    <article
      aria-label={`${trip.serviceName} departing ${trip.scheduledDeparture}`}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
    >
      {/* Header row */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {trip.conferenceDay}
          </p>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {trip.serviceName}
          </h3>
        </div>
        <span
          aria-label={`Status: ${statusLabel[trip.status]}`}
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[trip.status]}`}
        >
          {statusLabel[trip.status]}
        </span>
      </div>

      {/* Route */}
      <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">
        {trip.pickupLocation} → {trip.dropoffLocation}
      </p>

      {/* Time & occupancy */}
      <div className="mb-2 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
        <span>
          <span className="font-semibold">{trip.scheduledDeparture}</span>
        </span>
        <span className="text-gray-400">·</span>
        <span>
          {seatsLeft > 0 ? (
            <>
              <span className="font-semibold text-emerald-600">
                {seatsLeft}
              </span>{" "}
              seat{seatsLeft === 1 ? "" : "s"} available ({occupancyPct}% full)
            </>
          ) : (
            <span className="font-semibold text-red-600">Bus full</span>
          )}
        </span>
      </div>

      <TripStepper status={trip.status} />

      {trip.delegateNotice && (
        <div className="mt-2 min-w-0 rounded-lg border border-yellow-200 bg-yellow-50 px-2.5 py-2 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
          <p className="inline-flex min-h-[44px] items-start gap-2 text-xs font-medium">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span className="break-words whitespace-normal">
              {trip.delegateNotice}
            </span>
          </p>
        </div>
      )}

      {/* Airport transfer details */}
      {isAirport && (
        <div className="mt-2 space-y-1 rounded-lg border border-sky-200 bg-sky-50 p-2 dark:border-sky-800 dark:bg-sky-950">
          {trip.flightNumber && (
            <p className="text-xs text-sky-800 dark:text-sky-200">
              <span className="font-medium">Flight:</span> {trip.flightNumber}
            </p>
          )}
          {trip.terminal && (
            <p className="text-xs text-sky-800 dark:text-sky-200">
              <span className="font-medium">Terminal:</span> {trip.terminal}
            </p>
          )}
          {trip.pickupInstructions && (
            <p
              aria-label="Pickup instructions"
              className="mt-1 text-xs font-medium text-sky-900 dark:text-sky-100"
            >
              📍 {trip.pickupInstructions}
            </p>
          )}
        </div>
      )}

      {/* General pickup instructions for shuttles */}
      {!isAirport && trip.pickupInstructions && (
        <p
          aria-label="Pickup instructions"
          className="mt-1 text-xs text-gray-500 dark:text-gray-400"
        >
          📍 {trip.pickupInstructions}
        </p>
      )}
    </article>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

/**
 * Personalised fleet feed for the delegate portal.
 *
 * Reads the delegate's country from `localStorage` on mount, shows a country
 * selector, and renders a filtered + tabbed trip list using {@link useDelegateFleet}.
 */
export function PersonalizedFleet() {
  const [country, setCountry] = useState<string>(() => {
    if (!("window" in globalThis)) return "";
    try {
      return localStorage.getItem(LS_COUNTRY_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [activeTab, setActiveTab] = useState<RouteTab>("shuttle");
  const [selectedDay, setSelectedDay] = useState<string>("");

  const {
    data: dayFilteredTrips,
    availableDays,
    isLoading,
    error,
  } = useDayFilteredFleet(selectedDay.length > 0 ? selectedDay : null);

  // Persist country selection
  useEffect(() => {
    try {
      localStorage.setItem(LS_COUNTRY_KEY, country);
    } catch {
      // Storage unavailable — silently skip
    }
  }, [country]);

  const trips = dayFilteredTrips?.filter((trip) => {
    if (trip.status === "completed") return false;
    if (!country) return true;

    const assignedDelegationCodes = trip.assignedDelegations ?? [];
    if (assignedDelegationCodes.length === 0) return true;

    return assignedDelegationCodes.includes(country);
  });

  const shuttleTrips =
    trips?.filter((t) => !t.routeType || t.routeType === "shuttle") ?? [];
  const airportTrips =
    trips?.filter(
      (t) =>
        t.routeType === "airport_arrival" ||
        t.routeType === "airport_departure",
    ) ?? [];

  const displayedTrips = activeTab === "shuttle" ? shuttleTrips : airportTrips;

  return (
    <section
      aria-label="Your personalised transport feed"
      className="space-y-4"
    >
      <CountrySelector value={country} onChange={setCountry} />
      <DaySelector
        value={selectedDay}
        days={availableDays}
        onChange={setSelectedDay}
      />

      <RouteTypeTabs
        active={activeTab}
        onChange={setActiveTab}
        shuttleCount={shuttleTrips.length}
        airportCount={airportTrips.length}
      />

      {/* Status messages */}
      {isLoading && (
        <div
          aria-live="polite"
          className="flex items-center gap-2 py-6 text-sm text-gray-500"
        >
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span>Loading transport...</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
        >
          Unable to load live schedule. Please try again shortly.
        </div>
      )}

      {/* Trip list */}
      {!isLoading && !error && (
        <div aria-live="polite" className="space-y-3">
          {displayedTrips.length === 0 ? (
            <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
              {activeTab === "airport"
                ? "No airport transfers scheduled for your delegation."
                : "No shuttle services currently active."}
            </p>
          ) : (
            displayedTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)
          )}
        </div>
      )}
    </section>
  );
}
