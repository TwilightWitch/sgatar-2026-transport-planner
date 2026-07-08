"use client";

import { FidsBoard } from "@/components/FidsBoard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DisplayPage() {
  return (
    <div className="relative">
      <FidsBoard />
      <Link
        href="/"
        className="fixed left-3 top-3 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-white/30 bg-black/40 px-3 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-black/60"
        aria-label="Go back"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </Link>
      <Link
        href="/"
        className="fixed bottom-3 right-3 rounded bg-white/10 px-3 py-1.5 text-xs text-white/60 backdrop-blur hover:bg-white/20 hover:text-white"
      >
        ← Exit Display
      </Link>
    </div>
  );
}
