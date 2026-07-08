/**
 * @file BusCard — single bus card for the LO portal.
 *
 * Wraps {@link MilestoneTracker}, {@link HeadcountControls}, and
 * {@link SosButton} with a **draft-editing pattern**:
 *
 * - Changes to headcount and milestone status are held locally as draft state.
 * - A "Confirm" footer appears only when the draft diverges from the server
 *   state, making pending changes explicitly visible to the LO.
 * - "Discard" reverts to the last server-confirmed values without a network
 *   round-trip.
 * - Only on "Confirm" does the mutation fire, keeping network traffic minimal.
 * - SOS is intentionally immediate — it bypasses the draft pattern because
 *   emergency signals must not be delayed.
 *
 * The card is designed to be the only place that calls {@link useUpdateHeadcount}
 * for headcount/status changes; {@link MilestoneTracker} and
 * {@link HeadcountControls} run in controlled (draft) mode when used here.
 */
"use client";

import { HeadcountControls } from "@/components/HeadcountControls";
import { MilestoneTracker } from "@/components/lo/MilestoneTracker";
import { SosButton } from "@/components/SosButton";
import { useUpdateHeadcount, type TripWithRoute } from "@/hooks/useLiveFleet";
import { Check, MessageCircle, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Props for {@link BusCard}. */
interface BusCardProps {
  /** The live trip record to display and control. */
  trip: TripWithRoute;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function fillRatio(current: number, max: number): number {
  return max > 0 ? current / max : 0;
}

function fillColor(ratio: number): string {
  if (ratio >= 1) return "text-red-600 dark:text-red-400";
  if (ratio >= 0.8) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Full LO bus card with draft-aware headcount and milestone editing.
 *
 * @param props.trip - Live trip record from the React Query cache.
 */
export function BusCard({ trip }: Readonly<BusCardProps>) {
  const updateHeadcount = useUpdateHeadcount();

  const [draftPax, setDraftPax] = useState(trip.currentPax);
  const [draftStatus, setDraftStatus] = useState(trip.status);
  const [draftLoName, setDraftLoName] = useState(trip.loName ?? "");
  const [draftLoPhone, setDraftLoPhone] = useState(trip.loPhone ?? "");

  const isDirty =
    draftPax !== trip.currentPax ||
    draftStatus !== trip.status ||
    draftLoName !== (trip.loName ?? "") ||
    draftLoPhone !== (trip.loPhone ?? "");

  // Sync draft with server only when no edits are pending
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  useEffect(() => {
    if (!isDirtyRef.current) {
      setDraftPax(trip.currentPax);
      setDraftStatus(trip.status);
      setDraftLoName(trip.loName ?? "");
      setDraftLoPhone(trip.loPhone ?? "");
    }
  }, [trip.currentPax, trip.loName, trip.loPhone, trip.status]);

  function handleConfirm() {
    updateHeadcount.mutate({
      tripId: trip.id,
      currentPax: draftPax,
      status: draftStatus,
      loName: draftLoName || null,
      loPhone: draftLoPhone || null,
    });
  }

  function handleDiscard() {
    setDraftPax(trip.currentPax);
    setDraftStatus(trip.status);
    setDraftLoName(trip.loName ?? "");
    setDraftLoPhone(trip.loPhone ?? "");
  }

  const ratio = fillRatio(draftPax, trip.maxCapacity);

  return (
    <article
      aria-label={`${trip.busIdentifier} — ${trip.pickupLocation} to ${trip.dropoffLocation}`}
      className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
    >
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-gray-200">
            {trip.busIdentifier}
          </p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {trip.pickupLocation} → {trip.dropoffLocation}
          </p>
        </div>
        <span
          aria-label={`${draftPax} of ${trip.maxCapacity} passengers`}
          className={`ml-3 shrink-0 text-xl font-bold tabular-nums ${fillColor(ratio)}`}
        >
          {draftPax}/{trip.maxCapacity}
        </span>
      </div>

      {/* Controls */}
      <div className="space-y-3 p-4">
        {trip.driverPhone && (
          <a
            href={`https://wa.me/${trip.driverPhone.replace(/[^\d]/g, "")}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`Message driver ${trip.driverName ?? "on WhatsApp"}`}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-900/50"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Message Driver
          </a>
        )}

        <fieldset className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
            Liaison Officer Assignment
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-700 dark:text-gray-200">
              <span>LO Name</span>
              <input
                type="text"
                value={draftLoName}
                onChange={(event) => setDraftLoName(event.target.value)}
                className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                aria-label="Liaison officer name"
                placeholder="Enter LO full name"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-gray-700 dark:text-gray-200">
              <span>LO Phone</span>
              <input
                type="tel"
                value={draftLoPhone}
                onChange={(event) => setDraftLoPhone(event.target.value)}
                className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                aria-label="Liaison officer phone"
                placeholder="e.g. +65 9123 4567"
              />
            </label>
          </div>
        </fieldset>

        <MilestoneTracker
          trip={trip}
          draftStatus={draftStatus}
          onDraftStatusChange={setDraftStatus}
        />

        <HeadcountControls
          trip={trip}
          draftPax={draftPax}
          onDraftPaxChange={setDraftPax}
        />

        <SosButton trip={trip} />
      </div>

      {/* Confirm / Discard footer — only visible when draft has changes */}
      {isDirty && (
        <div
          aria-live="polite"
          className="flex items-center justify-between gap-2 border-t border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-800 dark:bg-amber-950/40"
        >
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
            Unsaved changes
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDiscard}
              aria-label="Discard changes"
              className="flex min-h-[36px] items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Discard
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={updateHeadcount.isPending}
              aria-label="Confirm and save changes"
              className="flex min-h-[36px] items-center gap-1 rounded-lg bg-brand-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Confirm
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
