/**
 * @file Health-check API route — `GET /api/health`.
 *
 * Returns a lightweight JSON response used by the Airbase container runtime
 * and any external uptime monitors to verify the app is responsive.
 *
 * Response shape: `{ status: "ok", timestamp: string, uptime: number }`
 */
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
