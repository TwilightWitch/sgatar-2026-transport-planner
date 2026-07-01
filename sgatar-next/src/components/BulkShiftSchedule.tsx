/**
 * @file BulkShiftSchedule component.
 *
 * Admin panel form that shifts the scheduled departure time of all
 * non-completed trips on a selected route forward by a given number of minutes,
 * simultaneously marking them as `"delayed"`.
 *
 * Useful when a traffic incident or late venue open affects an entire service
 * rather than individual buses.  Sends a `POST /api/trips/bulk-delay` request
 * and invokes `onShifted` on success so the parent can refresh the trip list.
 */
"use client";

import type { TripWithRoute } from "@/hooks/useLiveFleet";
import { useI18n } from "@/lib/i18n/provider";
import { Clock } from "lucide-react";
import { useState } from "react";

interface BulkShiftScheduleProps {
  trips: TripWithRoute[];
  onShifted?: () => void;
}

export function BulkShiftSchedule({
  trips,
  onShifted,
}: Readonly<BulkShiftScheduleProps>) {
  const { t } = useI18n();
  const [routeId, setRouteId] = useState("");
  const [delayMinutes, setDelayMinutes] = useState("15");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultOk, setResultOk] = useState(true);

  const uniqueRoutes = Array.from(
    new Map(trips.map((trip) => [trip.routeId, trip])).values(),
  );

  const post = (body: Record<string, unknown>) => {
    setSubmitting(true);
    setResult(null);
    void fetch("/api/trips/bulk-delay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const data = (await res.json()) as { message?: string; error?: string };
        setResultOk(res.ok);
        setResult(
          res.ok
            ? (data.message ?? "Done")
            : `Error: ${data.error ?? "Unknown error"}`,
        );
        if (res.ok) onShifted?.();
      })
      .finally(() => setSubmitting(false));
  };

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!routeId) return;
    post({ routeId, delayMinutes: Number.parseInt(delayMinutes, 10) });
  };

  const handleClear = () => {
    if (!routeId) return;
    post({ routeId, clearDelay: true });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-amber-500" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {t.bulkShiftSchedule}
        </h3>
      </div>

      <div className="space-y-3">
        <div>
          <label
            htmlFor="bulk-route"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            Route to delay
          </label>
          <select
            id="bulk-route"
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Select route...</option>
            {uniqueRoutes.map((route) => (
              <option key={route.routeId} value={route.routeId}>
                {route.serviceName} ({route.conferenceDay})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="bulk-delay"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            Delay (minutes)
          </label>
          <input
            id="bulk-delay"
            type="number"
            min="1"
            max="180"
            value={delayMinutes}
            onChange={(e) => setDelayMinutes(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {result && (
        <output
          className={`mt-3 block text-xs ${
            resultOk
              ? "text-amber-600 dark:text-amber-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {result}
        </output>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700"
        >
          {submitting ? "Applying..." : "Apply Delay"}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={submitting || !routeId}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Clear Delay
        </button>
      </div>
    </form>
  );
}
