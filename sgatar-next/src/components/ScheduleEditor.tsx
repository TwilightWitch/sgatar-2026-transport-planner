"use client";

import type { TripWithRoute } from "@/hooks/useLiveFleet";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { useState } from "react";

interface ScheduleEditorProps {
  trips: TripWithRoute[];
  onUpdated: () => void;
}

interface EditingState {
  id: string;
  field: string;
  value: string;
}

type SEProps = Readonly<ScheduleEditorProps>;

export function ScheduleEditor({ trips, onUpdated }: SEProps) {
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [filterDay, setFilterDay] = useState<string>("all");

  const days = [...new Set(trips.map((t) => t.conferenceDay))];
  const filtered =
    filterDay === "all"
      ? trips
      : trips.filter((t) => t.conferenceDay === filterDay);

  function startEdit(id: string, field: string, currentValue: string) {
    setEditing({ id, field, value: currentValue });
  }

  function handleSave() {
    if (!editing) return;

    fetch(`/api/trips/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [editing.field]: editing.value }),
    })
      .then((res) => {
        if (res.ok) onUpdated();
      })
      .catch(() => {})
      .finally(() => setEditing(null));
  }

  function handleDelete(id: string) {
    fetch(`/api/trips/${id}`, { method: "DELETE" })
      .then((res) => {
        if (res.ok) onUpdated();
      })
      .catch(() => {});
  }

  function handleStatusChange(id: string, status: string) {
    fetch(`/api/trips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
      .then((res) => {
        if (res.ok) onUpdated();
      })
      .catch(() => {});
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Schedule Editor
        </h2>
        <select
          value={filterDay}
          onChange={(e) => setFilterDay(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">All Days</option>
          {days.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-2 py-2">Day</th>
              <th className="px-2 py-2">Service</th>
              <th className="px-2 py-2">Bus</th>
              <th className="px-2 py-2">From</th>
              <th className="px-2 py-2">To</th>
              <th className="px-2 py-2">Dep</th>
              <th className="px-2 py-2">Arr</th>
              <th className="px-2 py-2">Pax/Cap</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((trip) => (
              <tr
                key={trip.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td className="whitespace-nowrap px-2 py-2 text-xs">
                  {trip.conferenceDay}
                </td>
                <td className="px-2 py-2">
                  <EditableCell
                    tripId={trip.id}
                    field="serviceName"
                    value={trip.serviceName}
                    editing={editing}
                    onStart={startEdit}
                    onChange={setEditing}
                    onSave={handleSave}
                    onCancel={() => setEditing(null)}
                  />
                </td>
                <td className="px-2 py-2">
                  <EditableCell
                    tripId={trip.id}
                    field="busIdentifier"
                    value={trip.busIdentifier}
                    editing={editing}
                    onStart={startEdit}
                    onChange={setEditing}
                    onSave={handleSave}
                    onCancel={() => setEditing(null)}
                  />
                </td>
                <td className="px-2 py-2">
                  <EditableCell
                    tripId={trip.id}
                    field="pickupLocation"
                    value={trip.pickupLocation}
                    editing={editing}
                    onStart={startEdit}
                    onChange={setEditing}
                    onSave={handleSave}
                    onCancel={() => setEditing(null)}
                  />
                </td>
                <td className="px-2 py-2">
                  <EditableCell
                    tripId={trip.id}
                    field="dropoffLocation"
                    value={trip.dropoffLocation}
                    editing={editing}
                    onStart={startEdit}
                    onChange={setEditing}
                    onSave={handleSave}
                    onCancel={() => setEditing(null)}
                  />
                </td>
                <td className="px-2 py-2">
                  <EditableCell
                    tripId={trip.id}
                    field="scheduledDeparture"
                    value={trip.scheduledDeparture}
                    editing={editing}
                    onStart={startEdit}
                    onChange={setEditing}
                    onSave={handleSave}
                    onCancel={() => setEditing(null)}
                  />
                </td>
                <td className="px-2 py-2">
                  <EditableCell
                    tripId={trip.id}
                    field="scheduledArrival"
                    value={trip.scheduledArrival}
                    editing={editing}
                    onStart={startEdit}
                    onChange={setEditing}
                    onSave={handleSave}
                    onCancel={() => setEditing(null)}
                  />
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-xs">
                  {trip.currentPax}/{trip.maxCapacity}
                </td>
                <td className="px-2 py-2">
                  <select
                    value={trip.status}
                    onChange={(e) =>
                      handleStatusChange(trip.id, e.target.value)
                    }
                    className="rounded border border-gray-200 bg-transparent px-1 py-0.5 text-xs dark:border-gray-700"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="boarding">Boarding</option>
                    <option value="en_route">En Route</option>
                    <option value="delayed">Delayed</option>
                    <option value="completed">Completed</option>
                  </select>
                </td>
                <td className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(trip.id)}
                    className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                    aria-label={`Delete trip ${trip.busIdentifier}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        Click any cell to edit inline. Changes persist in memory until server
        restart.
      </p>
    </section>
  );
}

interface EditableCellProps {
  tripId: string;
  field: string;
  value: string;
  editing: EditingState | null;
  onStart: (id: string, field: string, value: string) => void;
  onChange: (state: EditingState) => void;
  onSave: () => void;
  onCancel: () => void;
}

type ECProps = Readonly<EditableCellProps>;

function EditableCell(p: ECProps) {
  const { tripId, field, value, editing, onStart, onChange, onSave, onCancel } =
    p;
  const isEditing = editing?.id === tripId && editing?.field === field;

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={editing.value}
          onChange={(e) => onChange({ ...editing, value: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
            if (e.key === "Escape") onCancel();
          }}
          className="w-full min-w-[60px] rounded border border-brand-300 bg-white px-1 py-0.5 text-xs dark:border-brand-700 dark:bg-gray-800 dark:text-white"
          autoFocus
        />
        <button
          type="button"
          onClick={onSave}
          className="text-green-600"
          aria-label="Save"
        >
          <Save className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400"
          aria-label="Cancel"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onStart(tripId, field, value)}
      className="group flex items-center gap-1 text-left text-xs"
    >
      <span className="truncate max-w-[120px]">{value}</span>
      <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50" />
    </button>
  );
}
