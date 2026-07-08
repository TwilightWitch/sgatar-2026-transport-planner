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
import {
  AlertTriangle,
  Bus,
  CheckCircle,
  ChevronDown,
  Clock,
  MessageCircle,
  MessageSquarePlus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

interface FleetDashboardProps {
  trips: TripWithRoute[];
}

interface BroadcastDraft {
  operationalNote: string;
  delegateNotice: string;
}

const STATUS_OPTIONS: ReadonlyArray<{
  value: TripWithRoute["status"];
  label: string;
}> = [
  { value: "scheduled", label: "Scheduled" },
  { value: "boarding", label: "Boarding" },
  { value: "departed_origin", label: "Departed Origin" },
  { value: "en_route", label: "En Route" },
  { value: "delayed", label: "Delayed" },
  { value: "arrived_destination", label: "Arrived Destination" },
  { value: "completed", label: "Completed" },
];

const STATUS_STYLES: Record<string, string> = {
  arrived_destination:
    "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  en_route:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  boarding: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  delayed: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  departed_origin:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  arrived_destination: "Arrived Destination",
  en_route: "En Route",
  boarding: "Boarding",
  delayed: "Delayed",
  departed_origin: "Departed Origin",
  scheduled: "Scheduled",
  completed: "Completed",
};

function toWhatsAppHref(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export function FleetDashboard({ trips }: Readonly<FleetDashboardProps>) {
  const { t } = useI18n();
  const updateHeadcount = useUpdateHeadcount();
  const deleteTrip = useDeleteTrip();
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [draftBroadcast, setDraftBroadcast] = useState<BroadcastDraft>({
    operationalNote: "",
    delegateNotice: "",
  });
  const [statusMenuTripId, setStatusMenuTripId] = useState<string | null>(null);

  const sosTrips = trips.filter((trip) => trip.isSos);
  const activeTrips = trips.filter((trip) => trip.status !== "completed");
  const enRouteCount = trips.filter(
    (trip) => trip.status === "en_route",
  ).length;
  const completedCount = trips.filter(
    (trip) => trip.status === "completed",
  ).length;

  function handleClearSos(trip: TripWithRoute) {
    const confirmed = globalThis.window.confirm(
      "Are you sure you want to clear this SOS emergency flag?",
    );
    if (!confirmed) return;

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

  function openBroadcastEditor(trip: TripWithRoute) {
    setEditingTripId(trip.id);
    setDraftBroadcast({
      operationalNote: trip.operationalNote ?? "",
      delegateNotice: trip.delegateNotice ?? "",
    });
  }

  function cancelBroadcastEditor() {
    setEditingTripId(null);
    setDraftBroadcast({ operationalNote: "", delegateNotice: "" });
  }

  function saveBroadcast(trip: TripWithRoute) {
    updateHeadcount.mutate(
      {
        tripId: trip.id,
        currentPax: trip.currentPax,
        operationalNote: draftBroadcast.operationalNote.trim() || null,
        delegateNotice: draftBroadcast.delegateNotice.trim() || null,
      },
      {
        onSuccess: () => {
          cancelBroadcastEditor();
        },
      },
    );
  }

  function toggleStatusMenu(tripId: string) {
    setStatusMenuTripId((currentTripId) =>
      currentTripId === tripId ? null : tripId,
    );
  }

  function confirmStatusUpdate(
    trip: TripWithRoute,
    nextStatus: TripWithRoute["status"],
  ) {
    if (nextStatus === trip.status) {
      setStatusMenuTripId(null);
      return;
    }

    const confirmed = globalThis.window.confirm(
      `Update ${trip.busIdentifier} status from ${STATUS_LABELS[trip.status] ?? trip.status} to ${STATUS_LABELS[nextStatus] ?? nextStatus}?`,
    );
    if (!confirmed) {
      return;
    }

    updateHeadcount.mutate(
      {
        tripId: trip.id,
        currentPax: trip.currentPax,
        status: nextStatus,
      },
      {
        onSuccess: () => {
          setStatusMenuTripId(null);
        },
      },
    );
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
                    className="min-w-0 break-words whitespace-normal text-sm text-red-700 dark:text-red-300"
                  >
                    <strong>{trip.busIdentifier}</strong> ({trip.serviceName},{" "}
                    {trip.pickupLocation})
                    {trip.sosMessage && (
                      <span className="ml-2 inline-block max-w-full break-words whitespace-normal rounded bg-red-100 px-1.5 py-0.5 text-xs dark:bg-red-900">
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
            {activeTrips.map((trip) => {
              const loChatHref = toWhatsAppHref(trip.loPhone);
              const driverChatHref = toWhatsAppHref(trip.driverPhone);
              const isStatusMenuOpen = statusMenuTripId === trip.id;

              return (
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
                  <td className="min-w-0 px-4 py-3 text-gray-600 dark:text-gray-400">
                    <p className="min-w-0 break-words whitespace-normal font-medium text-gray-900 dark:text-gray-100">
                      {trip.serviceName}
                    </p>
                    {trip.isSos && trip.sosMessage && (
                      <p className="mt-1 min-w-0 break-words whitespace-normal rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/50 dark:text-red-200">
                        SOS: {trip.sosMessage}
                      </p>
                    )}
                    {trip.operationalNote && (
                      <p className="mt-1 min-w-0 break-words whitespace-normal rounded-md bg-indigo-50 px-2 py-1 text-xs text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                        <span className="font-semibold">Internal Note:</span>{" "}
                        {trip.operationalNote}
                      </p>
                    )}
                    {trip.delegateNotice && (
                      <p className="mt-1 min-w-0 break-words whitespace-normal rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                        <span className="font-semibold">
                          Delegate Broadcast:
                        </span>{" "}
                        {trip.delegateNotice}
                      </p>
                    )}
                    <p className="min-w-0 break-words whitespace-normal text-xs text-gray-500 dark:text-gray-400">
                      Driver: {trip.driverName ?? "-"}{" "}
                      {trip.driverPhone ? `(${trip.driverPhone})` : ""}
                    </p>
                    <p className="min-w-0 break-words whitespace-normal text-xs text-gray-500 dark:text-gray-400">
                      LO: {trip.loName ?? "-"}{" "}
                      {trip.loPhone ? `(${trip.loPhone})` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleStatusMenu(trip.id)}
                        aria-expanded={isStatusMenuOpen}
                        aria-haspopup="menu"
                        aria-label={`Change status for ${trip.busIdentifier}`}
                        className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-3 py-2 text-xs font-medium ${STATUS_STYLES[trip.status] ?? STATUS_STYLES.scheduled}`}
                      >
                        <span>{STATUS_LABELS[trip.status] ?? trip.status}</span>
                        <ChevronDown
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      </button>

                      {isStatusMenuOpen && (
                        <div
                          role="menu"
                          aria-label={`Status options for ${trip.busIdentifier}`}
                          className="absolute z-10 min-w-[13rem] rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
                        >
                          {STATUS_OPTIONS.map((statusOption) => (
                            <button
                              key={statusOption.value}
                              type="button"
                              role="menuitem"
                              disabled={updateHeadcount.isPending}
                              onClick={() =>
                                confirmStatusUpdate(trip, statusOption.value)
                              }
                              className={`flex min-h-[44px] w-full items-center rounded-md px-3 py-2 text-left text-xs font-medium transition-colors ${
                                statusOption.value === trip.status
                                  ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                              }`}
                            >
                              {statusOption.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openBroadcastEditor(trip)}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
                        aria-label={`Add note or broadcast for ${trip.busIdentifier}`}
                      >
                        <MessageSquarePlus
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                        Add Note/Broadcast
                      </button>
                      {trip.isSos && (
                        <>
                          {loChatHref && (
                            <a
                              href={loChatHref}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/50 dark:text-green-300"
                              aria-label={`Chat with LO for ${trip.busIdentifier} on WhatsApp`}
                              title="Chat with LO"
                            >
                              <MessageCircle
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            </a>
                          )}
                          {driverChatHref && (
                            <a
                              href={driverChatHref}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300"
                              aria-label={`Chat with driver for ${trip.busIdentifier} on WhatsApp`}
                              title="Chat with Driver"
                            >
                              <MessageCircle
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleClearSos(trip)}
                            className="min-h-[44px] rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                            aria-label={`Clear SOS for ${trip.busIdentifier}`}
                          >
                            Clear SOS
                          </button>
                        </>
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

                    {editingTripId === trip.id && (
                      <div className="mt-3 min-w-0 space-y-2 rounded-lg border border-indigo-200 bg-indigo-50/70 p-3 dark:border-indigo-800 dark:bg-indigo-950/30">
                        <label className="block text-xs font-semibold text-indigo-800 dark:text-indigo-200">
                          Internal LO Note
                          <textarea
                            value={draftBroadcast.operationalNote}
                            onChange={(event) =>
                              setDraftBroadcast((prev) => ({
                                ...prev,
                                operationalNote: event.target.value,
                              }))
                            }
                            rows={2}
                            className="mt-1 min-h-[44px] w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs text-gray-800 dark:border-indigo-700 dark:bg-gray-900 dark:text-gray-100"
                          />
                        </label>
                        <label className="block text-xs font-semibold text-amber-800 dark:text-amber-200">
                          Public Delegate Broadcast
                          <textarea
                            value={draftBroadcast.delegateNotice}
                            onChange={(event) =>
                              setDraftBroadcast((prev) => ({
                                ...prev,
                                delegateNotice: event.target.value,
                              }))
                            }
                            rows={2}
                            className="mt-1 min-h-[44px] w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-gray-800 dark:border-amber-700 dark:bg-gray-900 dark:text-gray-100"
                          />
                        </label>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => saveBroadcast(trip)}
                            disabled={updateHeadcount.isPending}
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                            aria-label={`Save note and broadcast for ${trip.busIdentifier}`}
                          >
                            <Save className="h-4 w-4" aria-hidden="true" />
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelBroadcastEditor}
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                            aria-label="Cancel note and broadcast edit"
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
