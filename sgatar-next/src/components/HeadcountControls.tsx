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
import { useEffect, useRef, useState } from "react";

interface HeadcountControlsProps {
  trip: TripWithRoute;
  /**
   * When provided the control runs in **draft mode**: every change calls
   * {@link onDraftPaxChange} instead of immediately mutating the server.
   * Used by {@link BusCard} to batch headcount + milestone under one Confirm.
   */
  draftPax?: number;
  /** Required when `draftPax` is provided. */
  onDraftPaxChange?: (pax: number) => void;
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

export function HeadcountControls({
  trip,
  draftPax,
  onDraftPaxChange,
}: Readonly<HeadcountControlsProps>) {
  const { t } = useI18n();
  const updateHeadcount = useUpdateHeadcount();
  const [textInput, setTextInput] = useState("");
  const [editingText, setEditingText] = useState(false);

  // In draft mode, the displayed pax is driven by the parent.
  // In uncontrolled mode it comes from the server via trip.currentPax.
  const displayPax = draftPax ?? trip.currentPax;

  // ── Slider local state ───────────────────────────────────────────────────
  // The slider uses its own local value so that rapid dragging doesn't fire
  // a mutation on every pixel.  We only commit when the pointer is released.
  // A ref tracks whether a drag is in progress so the 4-second server refetch
  // doesn't snap the slider back mid-drag.
  const [sliderValue, setSliderValue] = useState(trip.currentPax);
  const isDragging = useRef(false);

  // Keep slider in sync with the effective displayed pax (draft or server)
  useEffect(() => {
    if (!isDragging.current) {
      setSliderValue(displayPax);
    }
  }, [displayPax]);

  const clamp = (v: number) => Math.min(Math.max(0, v), trip.maxCapacity);

  const commit = (newPax: number) => {
    const clamped = clamp(newPax);
    if (onDraftPaxChange) {
      // Draft mode: notify parent, keep slider in sync
      onDraftPaxChange(clamped);
      setSliderValue(clamped);
    } else {
      setSliderValue(clamped);
      updateHeadcount.mutate({ tripId: trip.id, currentPax: clamped });
    }
  };

  const handleIncrement = () => commit(displayPax + 1);
  const handleDecrement = () => commit(displayPax - 1);

  // Slider: update local display only while dragging
  const handleSliderChange = (e: { target: HTMLInputElement }) => {
    setSliderValue(Number(e.target.value));
  };

  // Commit on pointer/touch release — fires once per drag gesture
  const handleSliderCommit = () => {
    isDragging.current = false;
    commit(sliderValue);
  };

  const handleSliderPointerDown = () => {
    isDragging.current = true;
  };

  const handleTextFocus = () => {
    setTextInput(String(displayPax));
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

  const fillRatio = trip.maxCapacity > 0 ? displayPax / trip.maxCapacity : 0;
  const fillPercent = Math.min(Math.round(fillRatio * 100), 100);

  return (
    <div aria-label={`${t.headcount} - ${trip.busIdentifier}`}>
      {/* Show card chrome only in standalone (non-draft) mode; BusCard provides its own header */}
      {!onDraftPaxChange && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {trip.busIdentifier}
            </h3>
            <span className={`text-xl font-bold ${getStatusColor(fillRatio)}`}>
              {displayPax}/{trip.maxCapacity}
            </span>
          </div>
          <p className="mb-3 truncate text-xs text-gray-500 dark:text-gray-400">
            {trip.pickupLocation} → {trip.dropoffLocation}
          </p>
        </>
      )}

      {/* Capacity bar */}
      <div
        role="progressbar"
        aria-valuenow={fillPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${t.capacity}: ${fillPercent}%`}
        className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
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
          disabled={displayPax <= 0}
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
            aria-label={`${displayPax} passengers — tap to type a value`}
            className="min-w-[3rem] rounded-lg px-2 py-1 text-3xl font-bold text-gray-900 hover:bg-gray-100 active:bg-gray-200 dark:text-white dark:hover:bg-gray-800"
          >
            <span aria-live="polite">{displayPax}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleIncrement}
          disabled={displayPax >= trip.maxCapacity}
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
          <span className="font-medium">{sliderValue} pax</span>
          <span>{trip.maxCapacity}</span>
        </label>
        <input
          id={`slider-${trip.id}`}
          type="range"
          min={0}
          max={trip.maxCapacity}
          value={sliderValue}
          onChange={handleSliderChange}
          onPointerDown={handleSliderPointerDown}
          onPointerUp={handleSliderCommit}
          onTouchEnd={handleSliderCommit}
          aria-label={`Passenger count: ${sliderValue} of ${trip.maxCapacity}`}
          className="w-full accent-brand-600"
        />
      </div>
    </div>
  );
}
