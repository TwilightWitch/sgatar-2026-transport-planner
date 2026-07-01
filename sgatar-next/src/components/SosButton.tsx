"use client";

import { useUpdateHeadcount, type TripWithRoute } from "@/hooks/useLiveFleet";
import { useI18n } from "@/lib/i18n/provider";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

interface SosButtonProps {
  trip: TripWithRoute;
}

export function SosButton({ trip }: Readonly<SosButtonProps>) {
  const { t } = useI18n();
  const updateHeadcount = useUpdateHeadcount();
  const [showInput, setShowInput] = useState(false);
  const [message, setMessage] = useState(trip.sosMessage ?? "");

  const handleActivateSos = () => {
    if (trip.isSos) {
      updateHeadcount.mutate({
        tripId: trip.id,
        currentPax: trip.currentPax,
        isSos: false,
        sosMessage: null,
      });
      setShowInput(false);
      setMessage("");
    } else {
      setShowInput(true);
    }
  };

  const handleSubmitSos = () => {
    updateHeadcount.mutate({
      tripId: trip.id,
      currentPax: trip.currentPax,
      isSos: true,
      sosMessage: message.trim() || "SOS triggered (no details provided)",
    });
    setShowInput(false);
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleActivateSos}
        aria-pressed={trip.isSos}
        aria-label={t.sosEscalation}
        className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 text-sm font-bold uppercase tracking-wide transition-all ${
          trip.isSos
            ? "animate-sos-pulse border-red-500 bg-red-600 text-white shadow-lg shadow-red-500/25"
            : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-700 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
        }`}
      >
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        {trip.isSos ? "Clear SOS" : t.sosEscalation}
      </button>

      {showInput && !trip.isSos && (
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the issue briefly"
            className="flex-1 rounded-lg border border-red-300 px-3 py-2 text-sm placeholder:text-gray-400 dark:border-red-700 dark:bg-gray-900 dark:text-white"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmitSos();
            }}
          />
          <button
            type="button"
            onClick={handleSubmitSos}
            className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Send
          </button>
        </div>
      )}

      {trip.isSos && trip.sosMessage && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          {trip.sosMessage}
        </p>
      )}
    </div>
  );
}
