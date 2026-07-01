"use client";

import { AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useUpdateHeadcount, type TripWithRoute } from "@/hooks/useLiveFleet";

interface SosButtonProps {
  trip: TripWithRoute;
}

export function SosButton({ trip }: SosButtonProps) {
  const { t } = useI18n();
  const updateHeadcount = useUpdateHeadcount();

  const handleSos = () => {
    updateHeadcount.mutate({
      tripId: trip.id,
      currentPax: trip.currentPax,
      isSos: !trip.isSos,
    });
  };

  return (
    <button
      type="button"
      onClick={handleSos}
      aria-pressed={trip.isSos}
      aria-label={t.sosEscalation}
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 text-sm font-bold uppercase tracking-wide transition-all ${
        trip.isSos
          ? "animate-sos-pulse border-red-500 bg-red-600 text-white shadow-lg shadow-red-500/25"
          : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-700 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
      }`}
    >
      <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      {t.sosEscalation}
    </button>
  );
}
