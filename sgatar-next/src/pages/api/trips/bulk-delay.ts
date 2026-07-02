/**
 * @file Bulk delay API route — `POST /api/trips/bulk-delay`.
 *
 * Shifts departure times forward (apply delay) or resets status to scheduled
 * (clear delay) for all non-completed trips on a route.
 */
import { getTrips, updateTrip } from "@/lib/tripStore";
import type { NextApiRequest, NextApiResponse } from "next";

interface BulkDelayBody {
  routeId: string;
  delayMinutes?: number;
  clearDelay?: boolean;
}

function addMinutesToTime(time: string, minutes: number): string {
  const parts = time.split(":");
  if (parts.length < 2) return time;
  const h = Number.parseInt(parts[0], 10);
  const m = Number.parseInt(parts[1], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

async function handleClearDelay(
  routeId: string,
  res: NextApiResponse,
): Promise<void> {
  if (process.env.DATABASE_URL) {
    try {
      const { db } = await import("@/db");
      const { activeTrips } = await import("@/db/schema");
      const { eq, and, sql } = await import("drizzle-orm");

      const updated = await db
        .update(activeTrips)
        .set({ status: "scheduled" })
        .where(
          and(
            eq(activeTrips.routeId, routeId),
            sql`${activeTrips.status} = 'delayed'`,
          ),
        )
        .returning();

      res.json({
        message: `Cleared delay on ${updated.length} trip${updated.length === 1 ? "" : "s"}`,
        affectedTrips: updated.length,
      });
      return;
    } catch (error) {
      console.error("POST bulk-delay clear DB error, falling back:", error);
    }
  }

  const storeTrips = getTrips();
  const affected = storeTrips.filter(
    (t) => t.routeId === routeId && t.status === "delayed",
  );
  for (const trip of affected) {
    updateTrip(trip.id, { status: "scheduled" });
  }
  res.json({
    message: `Cleared delay on ${affected.length} trip${affected.length === 1 ? "" : "s"}`,
    affectedTrips: affected.length,
  });
}

async function handleApplyDelay(
  routeId: string,
  delayMinutes: number,
  res: NextApiResponse,
): Promise<void> {
  if (process.env.DATABASE_URL) {
    try {
      const { db } = await import("@/db");
      const { activeTrips, routes } = await import("@/db/schema");
      const { eq, and, sql } = await import("drizzle-orm");

      await db
        .update(routes)
        .set({
          scheduledDeparture: sql`(${routes.scheduledDeparture}::time + (${delayMinutes} || ' minutes')::interval)::time`,
        })
        .where(eq(routes.id, routeId));

      const updated = await db
        .update(activeTrips)
        .set({ status: "delayed" })
        .where(
          and(
            eq(activeTrips.routeId, routeId),
            sql`${activeTrips.status} != 'completed'`,
          ),
        )
        .returning();

      res.json({
        message: `Delayed ${updated.length} trip${updated.length === 1 ? "" : "s"} by ${delayMinutes} minutes`,
        affectedTrips: updated.length,
      });
      return;
    } catch (error) {
      console.error("POST bulk-delay DB error, falling back:", error);
    }
  }

  const trips = getTrips();
  const affected = trips.filter(
    (t) => t.routeId === routeId && t.status !== "completed",
  );
  for (const trip of affected) {
    updateTrip(trip.id, {
      status: "delayed",
      scheduledDeparture: addMinutesToTime(
        trip.scheduledDeparture,
        delayMinutes,
      ),
      scheduledArrival: addMinutesToTime(trip.scheduledArrival, delayMinutes),
    });
  }
  res.json({
    message: `Delayed ${affected.length} trip${affected.length === 1 ? "" : "s"} by ${delayMinutes} minutes`,
    affectedTrips: affected.length,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).end("Method Not Allowed");
    return;
  }

  try {
    const body = req.body as BulkDelayBody;

    if (!body.routeId || typeof body.routeId !== "string") {
      res
        .status(400)
        .json({ error: "routeId is required and must be a string" });
      return;
    }

    if (body.clearDelay) {
      await handleClearDelay(body.routeId, res);
      return;
    }

    if (
      typeof body.delayMinutes !== "number" ||
      body.delayMinutes <= 0 ||
      body.delayMinutes > 180
    ) {
      res
        .status(400)
        .json({ error: "delayMinutes must be a positive number (max 180)" });
      return;
    }

    await handleApplyDelay(body.routeId, body.delayMinutes, res);
  } catch (error) {
    console.error("POST /api/trips/bulk-delay error:", error);
    res.status(500).json({ error: "Failed to apply bulk delay" });
  }
}
