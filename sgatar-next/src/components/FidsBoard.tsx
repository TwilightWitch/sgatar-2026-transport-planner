/**
 * @file FidsBoard component.
 *
 * Airport-style live departures board with conference-day filtering.
 */
"use client";

import { useDayFilteredFleet } from "@/hooks/useLiveFleet";
import { useMemo, useState } from "react";

/**
 * Full-screen departures board used on the display portal.
 */
export function FidsBoard() {
  const [selectedDay, setSelectedDay] = useState<string>("");
  const {
    data: dayTrips,
    availableDays,
    isLoading,
  } = useDayFilteredFleet(selectedDay || null);

  const activeTrips = useMemo(
    () =>
      (dayTrips ?? [])
        .filter((trip) => trip.status !== "completed")
        .sort((left, right) =>
          left.scheduledDeparture.localeCompare(right.scheduledDeparture),
        ),
    [dayTrips],
  );

  const statusText: Record<string, string> = {
    scheduled: "ON TIME",
    boarding: "BOARDING",
    en_route: "DEPARTED",
    delayed: "DELAYED",
    completed: "ARRIVED",
    departed_origin: "DEPARTED",
    arrived_destination: "ARRIVED",
  };

  const statusColor: Record<string, string> = {
    scheduled: "text-green-400",
    boarding: "text-yellow-300",
    en_route: "text-blue-400",
    delayed: "text-red-400 animate-pulse",
    completed: "text-gray-500",
    departed_origin: "text-blue-400",
    arrived_destination: "text-gray-400",
  };

  return (
    <div className="min-h-screen bg-black p-8 font-mono text-white">
      <header className="mb-8 border-b border-gray-700 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-wider text-yellow-400">
              SGATAR 2026 TRANSPORT
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              LIVE DEPARTURE INFORMATION
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="fids-day" className="text-sm text-gray-400">
              Day
            </label>
            <select
              id="fids-day"
              value={selectedDay}
              onChange={(event) => setSelectedDay(event.target.value)}
              className="min-h-[44px] rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
              aria-label="Filter departures by day"
            >
              <option value="">All days</option>
              {availableDays.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <time className="text-xl text-gray-400">
              {new Date().toLocaleTimeString("en-SG", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </div>
        </div>
      </header>

      {isLoading && (
        <p className="py-12 text-center text-xl text-gray-500">
          Loading departures...
        </p>
      )}

      {!isLoading && (
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
                  <td className="py-4 pr-4 text-gray-200">
                    {trip.serviceName}
                  </td>
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
      )}

      {activeTrips.length > 8 && (
        <div className="mt-4 text-center text-xs text-gray-600">
          Scroll view active - {activeTrips.length} departures
        </div>
      )}
    </div>
  );
}
