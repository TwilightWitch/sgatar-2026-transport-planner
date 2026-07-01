/**
 * @file Bulk delay API route — `POST /api/trips/bulk-delay`.
 *
 * Shifts the scheduled departure time of all non-completed trips on a given
 * route forward by a specified number of minutes, and marks their status as
 * `"delayed"`.  When `clearDelay: true` is passed instead, all delayed trips
 * on the route have their status reset to `"scheduled"` without touching times.
 *
 * When `DATABASE_URL` is configured the update is applied directly to the
 * `routes` table (so the base schedule shifts) and the `active_trips` statuses
 * are updated.  In no-DB mode the in-memory store is updated instead.
 *
 * Protected by the proxy authentication layer (admin token required).
 */
import { getTrips, updateTrip } from "@/lib/tripStore";
import { NextRequest, NextResponse } from "next/server";

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

async function handleClearDelay(routeId: string): Promise<NextResponse> {
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

      return NextResponse.json({
        message: `Cleared delay on ${updated.length} trip${updated.length === 1 ? "" : "s"}`,
        affectedTrips: updated.length,
      });
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
  return NextResponse.json({
    message: `Cleared delay on ${affected.length} trip${affected.length === 1 ? "" : "s"}`,
    affectedTrips: affected.length,
  });
}

async function handleApplyDelay(
  routeId: string,
  delayMinutes: number,
): Promise<NextResponse> {
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

      return NextResponse.json({
        message: `Delayed ${updated.length} trip${updated.length === 1 ? "" : "s"} by ${delayMinutes} minutes`,
        affectedTrips: updated.length,
      });
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
  return NextResponse.json({
    message: `Delayed ${affected.length} trip${affected.length === 1 ? "" : "s"} by ${delayMinutes} minutes`,
    affectedTrips: affected.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BulkDelayBody;

    if (!body.routeId || typeof body.routeId !== "string") {
      return NextResponse.json(
        { error: "routeId is required and must be a string" },
        { status: 400 },
      );
    }

    if (body.clearDelay) {
      return handleClearDelay(body.routeId);
    }

    if (
      typeof body.delayMinutes !== "number" ||
      body.delayMinutes <= 0 ||
      body.delayMinutes > 180
    ) {
      return NextResponse.json(
        { error: "delayMinutes must be a positive number (max 180)" },
        { status: 400 },
      );
    }

    return handleApplyDelay(body.routeId, body.delayMinutes);
  } catch (error) {
    console.error("POST /api/trips/bulk-delay error:", error);
    return NextResponse.json(
      { error: "Failed to apply bulk delay" },
      { status: 500 },
    );
  }
}
