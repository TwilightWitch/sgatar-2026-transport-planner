"use client";

import { CapacityWidget } from "@/components/CapacityWidget";
import { DepartureTimeline } from "@/components/DepartureTimeline";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { WhatsAppBanner } from "@/components/WhatsAppBanner";
import { useActiveTrips } from "@/hooks/useLiveFleet";

export default function DelegatePage() {
  const { data: trips, isLoading } = useActiveTrips();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <LanguageSwitcher />
      </div>

      <WhatsAppBanner />

      {isLoading && (
        <output className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <span className="sr-only">Loading transport information...</span>
        </output>
      )}

      {trips && (
        <>
          <CapacityWidget trips={trips} />
          <DepartureTimeline trips={trips} />
        </>
      )}
    </div>
  );
}
