"use client";

import { FidsBoard } from "@/components/FidsBoard";
import { useActiveTrips } from "@/hooks/useLiveFleet";

export default function DisplayPage() {
  const { data: trips } = useActiveTrips();

  if (!trips) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent" />
      </div>
    );
  }

  return <FidsBoard trips={trips} />;
}
