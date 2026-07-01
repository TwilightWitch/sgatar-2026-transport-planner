"use client";

import { AlertTriangle, Bus, CheckCircle, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import type { TripWithRoute } from "@/hooks/useLiveFleet";

interface FleetDashboardProps {
  trips: TripWithRoute[];
}

export function FleetDashboard({ trips }: FleetDashboardProps) {
  const { t } = useI18n();

  const sosTrips = trips.filter((trip) => trip.isSos);
  const activeTrips = trips.filter((trip) => trip.status !== "completed");
  const enRouteCount = trips.filter((trip) => trip.status === "en_route").length;
  const completedCount = trips.filter((trip) => trip.status === "completed").length;

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
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-red-800 dark:text-red-200">
                {sosTrips.length} Active SOS Flag{sosTrips.length > 1 ? "s" : ""}
              </h3>
              <ul className="mt-1 space-y-1">
                {sosTrips.map((trip) => (
                  <li key={trip.id} className="text-sm text-red-700 dark:text-red-300">
                    {trip.busIdentifier} — {trip.serviceName} ({trip.pickupLocation})
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
              <th scope="col" className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Bus</th>
              <th scope="col" className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Service</th>
              <th scope="col" className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{t.status}</th>
              <th scope="col" className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{t.capacity}</th>
              <th scope="col" className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {activeTrips.map((trip) => (
              <tr
                key={trip.id}
                className={`${trip.isSos ? "bg-red-50 dark:bg-red-950/30" : "bg-white dark:bg-gray-900"}`}
              >
                <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {trip.busIdentifier}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {trip.serviceName}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    trip.status === "en_route"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      : trip.status === "boarding"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : trip.status === "delayed"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  }`}>
                    {trip.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {trip.currentPax}/{trip.maxCapacity}
                </td>
                <td className="px-4 py-3">
                  {trip.isSos && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-3 w-3" aria-hidden="true" /> SOS
                    </span>
                  )}
                  {trip.isAdhoc && (
                    <span className="ml-1 inline-flex rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      Ad-hoc
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
