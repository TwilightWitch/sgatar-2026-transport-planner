/**
 * @file FleetDashboard component.
 *
 * Displays a real-time overview of the entire active bus fleet for admins:
 * - A flashing SOS alert banner listing any buses that have raised an
 *   emergency, including the LO's free-text description.
 * - Summary stats (active, en-route, completed, SOS counts).
 * - A full fleet table with per-bus status badges, capacity fractions, and
 *   ad-hoc / SOS flags.
 *
 * Receives the `trips` array directly from the parent admin page (which owns
 * the React Query subscription) so it re-renders on every poll cycle.
 */
"use client";

import type { TripWithRoute } from "@/hooks/useLiveFleet";
import { useDeleteTrip, useUpdateHeadcount } from "@/hooks/useLiveFleet";
import { useI18n } from "@/lib/i18n/provider";
import { AlertTriangle, Bus, CheckCircle, Clock, Trash2 } from "lucide-react";

interface FleetDashboardProps {
  trips: TripWithRoute[];
}

const STATUS_STYLES: Record<string, string> = {
  en_route:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  boarding: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  delayed: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  en_route: "En Route",
  boarding: "Boarding",
  delayed: "Delayed",
  scheduled: "Scheduled",
  completed: "Completed",
};

export function FleetDashboard({ trips }: Readonly<FleetDashboardProps>) {
  const { t } = useI18n();
  const updateHeadcount = useUpdateHeadcount();
  const deleteTrip = useDeleteTrip();

  const sosTrips = trips.filter((trip) => trip.isSos);
  const activeTrips = trips.filter((trip) => trip.status !== "completed");
  const enRouteCount = trips.filter(
    (trip) => trip.status === "en_route",
  ).length;
  const completedCount = trips.filter(
    (trip) => trip.status === "completed",
  ).length;

  function handleClearSos(trip: TripWithRoute) {
    updateHeadcount.mutate({
      tripId: trip.id,
      currentPax: trip.currentPax,
      isSos: false,
      sosMessage: null,
    });
  }

  function handleDeleteTrip(trip: TripWithRoute) {
    const confirmed = globalThis.window.confirm(
      `Delete active trip ${trip.busIdentifier} (${trip.serviceName})? This action cannot be undone.`,
    );
    if (!confirmed) return;
    deleteTrip.mutate(trip.id);
  }

  return (
    <section aria-label={t.fleetDashboard}>
      {/* SOS Alert Banner */}
      {sosTrips.length > 0 && (
        <div
          className="mb-6 animate-sos-pulse rounded-xl border-2 border-red-500 bg-red-50 p-4 dark:bg-red-950"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle
              className="h-6 w-6 text-red-600 dark:text-red-400"
              aria-hidden="true"
            />
            <div>
              <h3 className="font-bold text-red-800 dark:text-red-200">
                {sosTrips.length} Active SOS Flag
                {sosTrips.length > 1 ? "s" : ""}
              </h3>
              <ul className="mt-1 space-y-1">
                {sosTrips.map((trip) => (
                  <li
                    key={trip.id}
                    className="text-sm text-red-700 dark:text-red-300"
                  >
                    <strong>{trip.busIdentifier}</strong> ({trip.serviceName},{" "}
                    {trip.pickupLocation})
                    {trip.sosMessage && (
                      <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs dark:bg-red-900">
                        &ldquo;{trip.sosMessage}&rdquo;
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Bus className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-medium">Active</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {activeTrips.length}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-purple-500 dark:text-purple-400">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-medium">{t.enRoute}</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {enRouteCount}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400">
            <CheckCircle className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-medium">{t.completed}</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {completedCount}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-red-500 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-medium">SOS</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {sosTrips.length}
          </p>
        </div>
      </div>

      {/* Active Trips Table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300"
              >
                Day
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300"
              >
                Dep
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300"
              >
                Bus
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300"
              >
                Service / Contacts
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300"
              >
                {t.status}
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300"
              >
                {t.capacity}
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300"
              >
                Flags
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {activeTrips.map((trip) => (
              <tr
                key={trip.id}
                className={`${trip.isSos ? "bg-red-50 dark:bg-red-950/30" : "bg-white dark:bg-gray-900"}`}
              >
                <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                  {trip.conferenceDay}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-gray-700 dark:text-gray-300">
                  {trip.scheduledDeparture}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {trip.busIdentifier}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {trip.serviceName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Driver: {trip.driverName ?? "-"}{" "}
                    {trip.driverPhone ? `(${trip.driverPhone})` : ""}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    LO: {trip.loName ?? "-"}{" "}
                    {trip.loPhone ? `(${trip.loPhone})` : ""}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[trip.status] ?? STATUS_STYLES.scheduled}`}
                  >
                    {STATUS_LABELS[trip.status] ?? trip.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {trip.currentPax}/{trip.maxCapacity}
                </td>
                <td className="px-4 py-3">
                  {trip.isSos && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />{" "}
                      SOS
                    </span>
                  )}
                  {trip.currentPax >= trip.maxCapacity && (
                    <span className="ml-1 inline-flex rounded bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900 dark:text-red-300">
                      Full
                    </span>
                  )}
                  {trip.isAdhoc && (
                    <span className="ml-1 inline-flex rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      Ad-hoc
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {trip.isSos && (
                      <button
                        type="button"
                        onClick={() => handleClearSos(trip)}
                        className="min-h-[44px] rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                        aria-label={`Clear SOS for ${trip.busIdentifier}`}
                      >
                        Clear SOS
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteTrip(trip)}
                      className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                      aria-label={`Delete trip ${trip.busIdentifier}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
