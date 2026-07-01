/**
 * @file FidsBoard component.
 *
 * Airport-style Flight Information Display System (FIDS) board intended to
 * be cast to a large lobby monitor or TV screen.  Shows all non-completed
 * trips sorted by scheduled departure with large, high-contrast text and
 * status columns (ON TIME / BOARDING / DELAYED / DEPARTED).
 *
 * No user interaction is required — the parent `/display` page polls the trip
 * list via {@link useActiveTrips} and passes the updated array down.
 */
"use client";

import type { TripWithRoute } from "@/hooks/useLiveFleet";

interface FidsBoardProps {
  trips: TripWithRoute[];
}

export function FidsBoard({ trips }: Readonly<FidsBoardProps>) {
  const activeTrips = trips
    .filter((trip) => trip.status !== "completed")
    .sort((a, b) => a.scheduledDeparture.localeCompare(b.scheduledDeparture));

  const statusText: Record<string, string> = {
    scheduled: "ON TIME",
    boarding: "BOARDING",
    en_route: "DEPARTED",
    delayed: "DELAYED",
    completed: "ARRIVED",
  };

  const statusColor: Record<string, string> = {
    scheduled: "text-green-400",
    boarding: "text-yellow-300",
    en_route: "text-blue-400",
    delayed: "text-red-400 animate-pulse",
    completed: "text-gray-500",
  };

  return (
    <div className="min-h-screen bg-black p-8 font-mono text-white">
      {/* Header */}
      <header className="mb-8 border-b border-gray-700 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-wider text-yellow-400">
            SGATAR 2026 TRANSPORT
          </h1>
          <time className="text-xl text-gray-400">
            {new Date().toLocaleTimeString("en-SG", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
        <p className="mt-1 text-sm text-gray-500">LIVE DEPARTURE INFORMATION</p>
      </header>

      {/* FIDS Table */}
      <div className="overflow-hidden">
        <table className="w-full" aria-label="Departure information board">
          <thead>
            <tr className="border-b border-gray-700 text-left text-sm uppercase tracking-widest text-gray-500">
              <th scope="col" className="pb-3 pr-4">
                Time
              </th>
              <th scope="col" className="pb-3 pr-4">
                Service
              </th>
              <th scope="col" className="pb-3 pr-4">
                From
              </th>
              <th scope="col" className="pb-3 pr-4">
                To
              </th>
              <th scope="col" className="pb-3 pr-4">
                Bus
              </th>
              <th scope="col" className="pb-3 pr-4">
                Pax
              </th>
              <th scope="col" className="pb-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {activeTrips.map((trip) => (
              <tr key={trip.id} className="text-lg">
                <td className="whitespace-nowrap py-4 pr-4 text-2xl font-bold text-white">
                  {trip.scheduledDeparture}
                </td>
                <td className="py-4 pr-4 text-gray-200">{trip.serviceName}</td>
                <td className="py-4 pr-4 text-gray-300">
                  {trip.pickupLocation}
                </td>
                <td className="py-4 pr-4 text-gray-300">
                  {trip.dropoffLocation}
                </td>
                <td className="py-4 pr-4 font-medium text-cyan-400">
                  {trip.busIdentifier}
                </td>
                <td className="py-4 pr-4 text-gray-300">
                  {trip.currentPax}/{trip.maxCapacity}
                </td>
                <td
                  className={`py-4 font-bold tracking-wide ${statusColor[trip.status] ?? "text-gray-400"}`}
                >
                  {statusText[trip.status] ?? trip.status.toUpperCase()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {activeTrips.length === 0 && (
          <p className="py-12 text-center text-xl text-gray-600">
            NO ACTIVE DEPARTURES
          </p>
        )}
      </div>

      {/* Auto-scroll animation container */}
      {activeTrips.length > 8 && (
        <div className="mt-4 text-center text-xs text-gray-600">
          Scroll view active — {activeTrips.length} departures
        </div>
      )}
    </div>
  );
}
