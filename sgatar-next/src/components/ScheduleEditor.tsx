/**
 * @file ScheduleEditor component.
 *
 * Full CRUD administration UI for the master `routes` table with CSV export.
 */
"use client";

import {
  useCreateRoute,
  useDeleteRoute,
  useRoutes,
  useUpdateRoute,
  type MasterRoute,
  type MasterRouteInput,
} from "@/hooks/useLiveFleet";
import { Download, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

/** CSV header contract expected by CsvUpload. */
const SCHEDULE_EXPORT_HEADERS = [
  "conferenceDay",
  "serviceName",
  "targetArrival",
  "pickupLocation",
  "dropoffLocation",
  "scheduledDeparture",
  "scheduledArrival",
  "defaultCapacity",
  "routeType",
  "flightNumber",
  "terminal",
  "pickupInstructions",
] as const;

type ScheduleHeader = (typeof SCHEDULE_EXPORT_HEADERS)[number];

/** Editable form state for create/update route operations. */
interface RouteFormState {
  conferenceDay: string;
  serviceName: string;
  targetArrival: string;
  pickupLocation: string;
  dropoffLocation: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  defaultCapacity: number;
  routeType: string;
  flightNumber: string;
  terminal: string;
  pickupInstructions: string;
}

/**
 * Escapes a value for CSV output while preserving empty cells as blank strings.
 */
function escapeCsvValue(value: string | number | null): string {
  const normalized = value === null ? "" : String(value);
  if (!/[",\n]/.test(normalized)) return normalized;
  return `"${normalized.replaceAll('"', '""')}"`;
}

/**
 * Pure conversion utility from route rows to a CSV string.
 *
 * The header order intentionally matches CsvUpload parsing expectations.
 */
export function routesToCsv(routes: readonly MasterRoute[]): string {
  const headerLine = SCHEDULE_EXPORT_HEADERS.join(",");
  const dataLines = routes.map((route) => {
    const row: Record<ScheduleHeader, string | number | null> = {
      conferenceDay: route.conferenceDay,
      serviceName: route.serviceName,
      targetArrival: route.targetArrival,
      pickupLocation: route.pickupLocation,
      dropoffLocation: route.dropoffLocation,
      scheduledDeparture: route.scheduledDeparture,
      scheduledArrival: route.scheduledArrival,
      defaultCapacity: route.defaultCapacity,
      routeType: route.routeType,
      flightNumber: route.flightNumber,
      terminal: route.terminal,
      pickupInstructions: route.pickupInstructions,
    };

    return SCHEDULE_EXPORT_HEADERS.map((header) =>
      escapeCsvValue(row[header]),
    ).join(",");
  });

  return [headerLine, ...dataLines].join("\n");
}

function emptyRouteForm(): RouteFormState {
  return {
    conferenceDay: "",
    serviceName: "",
    targetArrival: "",
    pickupLocation: "",
    dropoffLocation: "",
    scheduledDeparture: "",
    scheduledArrival: "",
    defaultCapacity: 40,
    routeType: "shuttle",
    flightNumber: "",
    terminal: "",
    pickupInstructions: "",
  };
}

function toMutationPayload(form: RouteFormState): MasterRouteInput {
  return {
    conferenceDay: form.conferenceDay.trim(),
    serviceName: form.serviceName.trim(),
    targetArrival: form.targetArrival.trim(),
    pickupLocation: form.pickupLocation.trim(),
    dropoffLocation: form.dropoffLocation.trim(),
    scheduledDeparture: form.scheduledDeparture.trim(),
    scheduledArrival: form.scheduledArrival.trim(),
    defaultCapacity: form.defaultCapacity,
    routeType: form.routeType.trim() || "shuttle",
    flightNumber: form.flightNumber.trim() || null,
    terminal: form.terminal.trim() || null,
    pickupInstructions: form.pickupInstructions.trim() || null,
  };
}

function isValidRouteForm(form: RouteFormState): boolean {
  return (
    form.conferenceDay.trim().length > 0 &&
    form.serviceName.trim().length > 0 &&
    form.targetArrival.trim().length > 0 &&
    form.pickupLocation.trim().length > 0 &&
    form.dropoffLocation.trim().length > 0 &&
    form.scheduledDeparture.trim().length > 0 &&
    form.scheduledArrival.trim().length > 0 &&
    Number.isFinite(form.defaultCapacity) &&
    form.defaultCapacity > 0
  );
}

function formFromRoute(route: MasterRoute): RouteFormState {
  return {
    conferenceDay: route.conferenceDay,
    serviceName: route.serviceName,
    targetArrival: route.targetArrival,
    pickupLocation: route.pickupLocation,
    dropoffLocation: route.dropoffLocation,
    scheduledDeparture: route.scheduledDeparture,
    scheduledArrival: route.scheduledArrival,
    defaultCapacity: route.defaultCapacity,
    routeType: route.routeType ?? "shuttle",
    flightNumber: route.flightNumber ?? "",
    terminal: route.terminal ?? "",
    pickupInstructions: route.pickupInstructions ?? "",
  };
}

interface RouteFormProps {
  idPrefix: string;
  form: RouteFormState;
  onChange: (next: RouteFormState) => void;
}

function RouteFormFields({
  idPrefix,
  form,
  onChange,
}: Readonly<RouteFormProps>) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        <span>Conference Day</span>
        <input
          value={form.conferenceDay}
          onChange={(event) =>
            onChange({ ...form, conferenceDay: event.target.value })
          }
          id={`${idPrefix}-conferenceDay`}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </label>

      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        <span>Service Name</span>
        <input
          value={form.serviceName}
          onChange={(event) =>
            onChange({ ...form, serviceName: event.target.value })
          }
          id={`${idPrefix}-serviceName`}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </label>

      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        <span>Target Arrival</span>
        <input
          value={form.targetArrival}
          onChange={(event) =>
            onChange({ ...form, targetArrival: event.target.value })
          }
          id={`${idPrefix}-targetArrival`}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </label>

      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        <span>Pickup Location</span>
        <input
          value={form.pickupLocation}
          onChange={(event) =>
            onChange({ ...form, pickupLocation: event.target.value })
          }
          id={`${idPrefix}-pickupLocation`}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </label>

      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        <span>Dropoff Location</span>
        <input
          value={form.dropoffLocation}
          onChange={(event) =>
            onChange({ ...form, dropoffLocation: event.target.value })
          }
          id={`${idPrefix}-dropoffLocation`}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </label>

      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        <span>Scheduled Departure</span>
        <input
          value={form.scheduledDeparture}
          onChange={(event) =>
            onChange({ ...form, scheduledDeparture: event.target.value })
          }
          id={`${idPrefix}-scheduledDeparture`}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </label>

      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        <span>Scheduled Arrival</span>
        <input
          value={form.scheduledArrival}
          onChange={(event) =>
            onChange({ ...form, scheduledArrival: event.target.value })
          }
          id={`${idPrefix}-scheduledArrival`}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </label>

      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        <span>Default Capacity</span>
        <input
          type="number"
          min={1}
          value={form.defaultCapacity}
          onChange={(event) =>
            onChange({
              ...form,
              defaultCapacity: Number(event.target.value) || 1,
            })
          }
          id={`${idPrefix}-defaultCapacity`}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </label>

      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        <span>Route Type</span>
        <input
          value={form.routeType}
          onChange={(event) =>
            onChange({ ...form, routeType: event.target.value })
          }
          id={`${idPrefix}-routeType`}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </label>

      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        <span>Flight Number</span>
        <input
          value={form.flightNumber}
          onChange={(event) =>
            onChange({ ...form, flightNumber: event.target.value })
          }
          id={`${idPrefix}-flightNumber`}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </label>

      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        <span>Terminal</span>
        <input
          value={form.terminal}
          onChange={(event) =>
            onChange({ ...form, terminal: event.target.value })
          }
          id={`${idPrefix}-terminal`}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </label>

      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2 lg:col-span-3">
        <span>Pickup Instructions</span>
        <textarea
          value={form.pickupInstructions}
          onChange={(event) =>
            onChange({ ...form, pickupInstructions: event.target.value })
          }
          id={`${idPrefix}-pickupInstructions`}
          rows={2}
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </label>
    </div>
  );
}

/**
 * Admin schedule management panel for full master-route CRUD and CSV export.
 */
export function ScheduleEditor() {
  const { data: routes, isLoading, error } = useRoutes();
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();
  const deleteRoute = useDeleteRoute();

  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [createForm, setCreateForm] =
    useState<RouteFormState>(emptyRouteForm());
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RouteFormState>(emptyRouteForm());

  const allRoutes = useMemo(() => routes ?? [], [routes]);

  const availableDays = useMemo(
    () => [...new Set(allRoutes.map((route) => route.conferenceDay))],
    [allRoutes],
  );

  const filteredRoutes = useMemo(() => {
    if (selectedDay === "all") return allRoutes;
    return allRoutes.filter((route) => route.conferenceDay === selectedDay);
  }, [allRoutes, selectedDay]);

  function handleCreateRoute() {
    if (!isValidRouteForm(createForm)) return;
    createRoute.mutate(toMutationPayload(createForm), {
      onSuccess: () => {
        setCreateForm(emptyRouteForm());
      },
    });
  }

  function startEditing(route: MasterRoute) {
    setEditingRouteId(route.id);
    setEditForm(formFromRoute(route));
  }

  function cancelEditing() {
    setEditingRouteId(null);
    setEditForm(emptyRouteForm());
  }

  function saveEdit() {
    if (!editingRouteId || !isValidRouteForm(editForm)) return;
    updateRoute.mutate(
      {
        id: editingRouteId,
        ...toMutationPayload(editForm),
      },
      {
        onSuccess: () => {
          cancelEditing();
        },
      },
    );
  }

  function removeRoute(route: MasterRoute) {
    const confirmed = globalThis.window.confirm(
      `Delete route ${route.serviceName} on ${route.conferenceDay}? This action cannot be undone.`,
    );
    if (!confirmed) return;
    deleteRoute.mutate(route.id);
  }

  function exportScheduleToCsv() {
    const csv = routesToCsv(allRoutes);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "sgatar-master-schedule.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Master Schedule Editor
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="route-day-filter"
            className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300"
          >
            Day
          </label>
          <select
            id="route-day-filter"
            value={selectedDay}
            onChange={(event) => setSelectedDay(event.target.value)}
            className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Days</option>
            {availableDays.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={exportScheduleToCsv}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            aria-label="Export schedule to CSV"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export Schedule to CSV
          </button>
        </div>
      </div>

      <details className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/40">
        <summary className="min-h-[44px] cursor-pointer py-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
          Create New Route
        </summary>

        <div className="mt-3 space-y-3">
          <RouteFormFields
            idPrefix="create-route"
            form={createForm}
            onChange={setCreateForm}
          />
          <button
            type="button"
            onClick={handleCreateRoute}
            disabled={!isValidRouteForm(createForm) || createRoute.isPending}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            aria-label="Create route"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Route
          </button>
        </div>
      </details>

      {isLoading && (
        <p className="py-6 text-sm text-gray-500 dark:text-gray-400">
          Loading master routes...
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          Unable to load master routes.
        </p>
      )}

      <div className="space-y-3">
        {filteredRoutes.map((route) => {
          const isEditing = editingRouteId === route.id;

          return (
            <article
              key={route.id}
              className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
            >
              {!isEditing && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {route.serviceName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {route.conferenceDay} | {route.scheduledDeparture} -{" "}
                        {route.scheduledArrival}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(route)}
                        className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                        aria-label={`Edit route ${route.serviceName}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRoute(route)}
                        className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                        aria-label={`Delete route ${route.serviceName}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {route.pickupLocation} {"\u2192"} {route.dropoffLocation} |
                    Capacity {route.defaultCapacity}
                  </p>
                </div>
              )}

              {isEditing && (
                <div className="space-y-3">
                  <RouteFormFields
                    idPrefix={`edit-route-${route.id}`}
                    form={editForm}
                    onChange={setEditForm}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={
                        !isValidRouteForm(editForm) || updateRoute.isPending
                      }
                      className="inline-flex min-h-[44px] items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      aria-label="Save route edits"
                    >
                      <Save className="h-3.5 w-3.5" aria-hidden="true" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                      aria-label="Cancel route edits"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
