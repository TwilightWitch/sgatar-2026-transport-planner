/**
 * @file HeadcountControls component.
 *
 * LO portal card that lets a Liaison Officer record the passenger count for
 * their assigned bus.  Three input modes are available so operators can pick
 * whatever is fastest in the field:
 *
 * - **+/- buttons** — Large touch targets for one-handed tap increments.
 * - **Tappable number** — Tap the count to enter a precise figure via keyboard.
 * - **Slider** — Drag for quick coarse adjustments.
 *
 * Every committed value is sent to {@link useUpdateHeadcount} which applies an
 * optimistic cache update and handles offline queuing automatically.
 */
"use client";

import { useUpdateHeadcount, type TripWithRoute } from "@/hooks/useLiveFleet";
import { useI18n } from "@/lib/i18n/provider";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

interface HeadcountControlsProps {
  trip: TripWithRoute;
}

function getStatusColor(ratio: number): string {
  if (ratio >= 1) return "text-red-600 dark:text-red-400";
  if (ratio >= 0.8) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

function getBarColor(ratio: number): string {
  if (ratio >= 1) return "bg-red-500";
  if (ratio >= 0.8) return "bg-amber-500";
  return "bg-emerald-500";
}

export function HeadcountControls({ trip }: Readonly<HeadcountControlsProps>) {
  const { t } = useI18n();
  const updateHeadcount = useUpdateHeadcount();
  const [textInput, setTextInput] = useState("");
  const [editingText, setEditingText] = useState(false);

  const clamp = (v: number) => Math.min(Math.max(0, v), trip.maxCapacity);

  const commit = (newPax: number) => {
    updateHeadcount.mutate({ tripId: trip.id, currentPax: clamp(newPax) });
  };

  const handleIncrement = () => commit(trip.currentPax + 1);
  const handleDecrement = () => commit(trip.currentPax - 1);

  const handleSlider = (e: { target: HTMLInputElement }) => {
    commit(Number(e.target.value));
  };

  const handleTextFocus = () => {
    setTextInput(String(trip.currentPax));
    setEditingText(true);
  };

  const handleTextChange = (e: { target: HTMLInputElement }) => {
    setTextInput(e.target.value);
  };

  const handleTextCommit = () => {
    const parsed = Number.parseInt(textInput, 10);
    if (!Number.isNaN(parsed)) commit(parsed);
    setEditingText(false);
    setTextInput("");
  };

  const handleTextKeyDown = (e: { key: string }) => {
    if (e.key === "Enter") handleTextCommit();
    if (e.key === "Escape") {
      setEditingText(false);
      setTextInput("");
    }
  };

  const fillRatio =
    trip.maxCapacity > 0 ? trip.currentPax / trip.maxCapacity : 0;
  const fillPercent = Math.min(Math.round(fillRatio * 100), 100);

  return (
    <article
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      aria-label={`${t.headcount} - ${trip.busIdentifier}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {trip.busIdentifier}
        </h3>
        <span className={`text-xl font-bold ${getStatusColor(fillRatio)}`}>
          {trip.currentPax}/{trip.maxCapacity}
        </span>
      </div>

      <p className="mb-3 truncate text-xs text-gray-500 dark:text-gray-400">
        {trip.pickupLocation} → {trip.dropoffLocation}
      </p>

      {/* Capacity bar */}
      <progress
        className="mb-1 h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-gray-200 dark:[&::-webkit-progress-bar]:bg-gray-700 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all"
        value={fillPercent}
        max={100}
        aria-label={`${t.capacity}: ${fillPercent}%`}
      >
        {fillPercent}%
      </progress>
      <div
        className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
        aria-hidden="true"
      >
        <div
          className={`h-full rounded-full transition-all ${getBarColor(fillRatio)}`}
          style={{ width: `${fillPercent}%` }}
        />
      </div>

      {/* +/- buttons with tappable number display */}
      <div className="mb-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={trip.currentPax <= 0}
          aria-label={t.removePassenger}
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-red-300 bg-red-50 text-red-600 transition-colors hover:bg-red-100 active:bg-red-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-700 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
        >
          <Minus className="h-5 w-5" aria-hidden="true" />
        </button>

        {editingText ? (
          <input
            type="number"
            value={textInput}
            min={0}
            max={trip.maxCapacity}
            onChange={handleTextChange}
            onBlur={handleTextCommit}
            onKeyDown={handleTextKeyDown}
            aria-label="Enter passenger count"
            className="w-20 rounded-lg border-2 border-brand-500 bg-white text-center text-3xl font-bold text-gray-900 focus:outline-none dark:bg-gray-800 dark:text-white"
            autoFocus // intentional — opens keyboard immediately for mobile LOs
          />
        ) : (
          <button
            type="button"
            onClick={handleTextFocus}
            title="Tap to type a number"
            aria-label={`${trip.currentPax} passengers — tap to type a value`}
            className="min-w-[3rem] rounded-lg px-2 py-1 text-3xl font-bold text-gray-900 hover:bg-gray-100 active:bg-gray-200 dark:text-white dark:hover:bg-gray-800"
          >
            <span aria-live="polite">{trip.currentPax}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleIncrement}
          disabled={trip.currentPax >= trip.maxCapacity}
          aria-label={t.addPassenger}
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-300 bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100 active:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Slider for quick coarse adjustment */}
      <div>
        <label
          htmlFor={`slider-${trip.id}`}
          className="mb-1 flex justify-between text-xs text-gray-500 dark:text-gray-400"
        >
          <span>0</span>
          <span className="font-medium">{trip.currentPax} pax</span>
          <span>{trip.maxCapacity}</span>
        </label>
        <input
          id={`slider-${trip.id}`}
          type="range"
          min={0}
          max={trip.maxCapacity}
          value={trip.currentPax}
          onChange={handleSlider}
          aria-label={`Passenger count: ${trip.currentPax} of ${trip.maxCapacity}`}
          className="w-full accent-brand-600"
        />
      </div>
    </article>
  );
}
