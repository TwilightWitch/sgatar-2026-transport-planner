/**
 * @file Health-check API route — `GET /api/health`.
 *
 * Lightweight endpoint used by the Airbase container runtime and any external
 * uptime monitors to verify the app is responsive.
 */
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
): void {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
