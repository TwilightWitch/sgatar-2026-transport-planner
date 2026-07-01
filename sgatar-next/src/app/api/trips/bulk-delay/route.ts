import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { activeTrips, routes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

interface BulkDelayBody {
  routeId: string;
  delayMinutes: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BulkDelayBody;

    if (!body.routeId || typeof body.routeId !== "string") {
      return NextResponse.json(
        { error: "routeId is required and must be a string" },
        { status: 400 }
      );
    }

    if (
      typeof body.delayMinutes !== "number" ||
      body.delayMinutes <= 0 ||
      body.delayMinutes > 180
    ) {
      return NextResponse.json(
        { error: "delayMinutes must be a positive number (max 180)" },
        { status: 400 }
      );
    }

    // Update the scheduled departure on the route itself
    await db
      .update(routes)
      .set({
        scheduledDeparture: sql`(${routes.scheduledDeparture}::time + (${body.delayMinutes} || ' minutes')::interval)::time`,
      })
      .where(eq(routes.id, body.routeId));

    // Mark all non-completed active trips for this route as delayed
    const updated = await db
      .update(activeTrips)
      .set({ status: "delayed" })
      .where(
        and(
          eq(activeTrips.routeId, body.routeId),
          sql`${activeTrips.status} != 'completed'`
        )
      )
      .returning();

    return NextResponse.json({
      message: `Shifted ${updated.length} trips by ${body.delayMinutes} minutes`,
      affectedTrips: updated.length,
    });
  } catch (error) {
    console.error("POST /api/trips/bulk-delay error:", error);
    return NextResponse.json(
      { error: "Failed to apply bulk delay" },
      { status: 500 }
    );
  }
}
