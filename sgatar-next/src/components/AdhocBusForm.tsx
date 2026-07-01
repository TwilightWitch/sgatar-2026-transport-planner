"use client";

import type { TripWithRoute } from "@/hooks/useLiveFleet";
import { useI18n } from "@/lib/i18n/provider";
import { PlusCircle } from "lucide-react";
import { useState } from "react";

interface AdhocBusFormProps {
  trips: TripWithRoute[];
  onCreated?: () => void;
}

export function AdhocBusForm({
  trips,
  onCreated,
}: Readonly<AdhocBusFormProps>) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [routeId, setRouteId] = useState("");
  const [busIdentifier, setBusIdentifier] = useState("");
  const [capacity, setCapacity] = useState("40");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Extract unique route IDs from trips
  const uniqueRoutes = Array.from(
    new Map(trips.map((trip) => [trip.routeId, trip])).values(),
  );

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!routeId || !busIdentifier) return;

    setSubmitting(true);
    void fetch("/api/trips/adhoc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        routeId,
        busIdentifier,
        maxCapacity: Number.parseInt(capacity, 10),
        operationalNote: note || undefined,
      }),
    })
      .then((res) => {
        if (res.ok) {
          setIsOpen(false);
          setBusIdentifier("");
          setNote("");
          onCreated?.();
        }
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-brand-500 hover:text-brand-600 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-brand-500"
      >
        <PlusCircle className="h-5 w-5" aria-hidden="true" />
        {t.addAdhocBus}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
    >
      <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
        {t.addAdhocBus}
      </h3>

      <div className="space-y-3">
        <div>
          <label
            htmlFor="adhoc-route"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            Route
          </label>
          <select
            id="adhoc-route"
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Select route...</option>
            {uniqueRoutes.map((route) => (
              <option key={route.routeId} value={route.routeId}>
                {route.serviceName} ({route.pickupLocation} →{" "}
                {route.dropoffLocation})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="adhoc-bus-id"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            Bus Identifier
          </label>
          <input
            id="adhoc-bus-id"
            type="text"
            value={busIdentifier}
            onChange={(e) => setBusIdentifier(e.target.value)}
            required
            placeholder="e.g. GHOST-01"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="adhoc-capacity"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            {t.capacity}
          </label>
          <input
            id="adhoc-capacity"
            type="number"
            min="1"
            max="100"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="adhoc-note"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            Note (optional)
          </label>
          <input
            id="adhoc-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Operational note"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Ghost Bus"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
