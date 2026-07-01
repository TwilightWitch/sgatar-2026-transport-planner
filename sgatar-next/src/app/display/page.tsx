"use client";

import { FidsBoard } from "@/components/FidsBoard";
import { useActiveTrips } from "@/hooks/useLiveFleet";
import Link from "next/link";

export default function DisplayPage() {
  const { data: trips } = useActiveTrips();

  if (!trips) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative">
      <FidsBoard trips={trips} />
      <Link
        href="/"
        className="fixed bottom-3 right-3 rounded bg-white/10 px-3 py-1.5 text-xs text-white/60 backdrop-blur hover:bg-white/20 hover:text-white"
      >
        ← Exit Display
      </Link>
    </div>
  );
}
