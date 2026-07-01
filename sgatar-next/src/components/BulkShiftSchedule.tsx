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

  const uniqueRoutes = Array.from(
    new Map(trips.map((trip) => [trip.routeId, trip])).values(),
  );

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!routeId) return;

    setSubmitting(true);
    setResult(null);
    void fetch("/api/trips/bulk-delay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        routeId,
        delayMinutes: Number.parseInt(delayMinutes, 10),
      }),
    })
      .then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as { message: string };
          setResult(data.message);
          onShifted?.();
        } else {
          const err = (await res.json()) as { error: string };
          setResult(`Error: ${err.error}`);
        }
      })
      .finally(() => {
        setSubmitting(false);
      });
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
        <output className="mt-3 block text-xs text-gray-600 dark:text-gray-400">
          {result}
        </output>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700"
      >
        {submitting ? "Applying..." : "Apply Delay"}
      </button>
    </form>
  );
}
