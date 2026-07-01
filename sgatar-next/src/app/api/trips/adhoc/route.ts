/**
 * @file Ad-hoc bus API route — `POST /api/trips/adhoc`.
 *
 * Creates an unplanned "ghost bus" trip that is added to the live roster
 * immediately.  Useful when demand exceeds the pre-planned fleet and an
 * additional vehicle is dispatched on-the-fly.
 *
 * The new trip is tagged `isAdhoc: true` so it can be visually distinguished
 * in the admin dashboard and FIDS display.
 *
 * Protected by the proxy authentication layer (admin token required).
 */
import type { TripWithRoute } from "@/hooks/useLiveFleet";
import { addTrip, getTrips } from "@/lib/tripStore";
import { NextRequest, NextResponse } from "next/server";

interface AdhocBody {
  routeId: string;
  busIdentifier: string;
  maxCapacity?: number;
  operationalNote?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AdhocBody;

    if (!body.routeId || typeof body.routeId !== "string") {
      return NextResponse.json(
        { error: "routeId is required" },
        { status: 400 },
      );
    }

    if (!body.busIdentifier || typeof body.busIdentifier !== "string") {
      return NextResponse.json(
        { error: "busIdentifier is required" },
        { status: 400 },
      );
    }

    const capacity = body.maxCapacity ?? 40;
    if (capacity < 1 || capacity > 100) {
      return NextResponse.json(
        { error: "maxCapacity must be between 1 and 100" },
        { status: 400 },
      );
    }

    // If DB is configured, use it
    if (process.env.DATABASE_URL) {
      try {
        const { db } = await import("@/db");
        const { activeTrips } = await import("@/db/schema");

        const [newTrip] = await db
          .insert(activeTrips)
          .values({
            routeId: body.routeId,
            busIdentifier: body.busIdentifier,
            maxCapacity: capacity,
            currentPax: 0,
            assignedLoCount: 1,
            status: "scheduled",
            operationalNote: body.operationalNote ?? "Ad-hoc ghost bus",
            isSos: false,
            isAdhoc: true,
          })
          .returning();

        return NextResponse.json(newTrip, { status: 201 });
      } catch (error) {
        console.error("POST adhoc DB error, falling back to in-memory:", error);
      }
    }

    // Fallback: add to in-memory store
    const existingTrips = getTrips();
    const newTrip: TripWithRoute = {
      id: `adhoc-${crypto.randomUUID()}`,
      routeId: body.routeId,
      busIdentifier: body.busIdentifier,
      maxCapacity: capacity,
      currentPax: 0,
      assignedLoCount: 1,
      status: "scheduled",
      actualDepartureTime: null,
      actualArrivalTime: null,
      operationalNote: body.operationalNote ?? "Ad-hoc ghost bus",
      isSos: false,
      sosMessage: null,
      isAdhoc: true,
      conferenceDay: existingTrips[0]?.conferenceDay ?? "7 Sep (Mon)",
      serviceName: "Ad-Hoc Service",
      targetArrival: "—",
      pickupLocation: "TBC",
      dropoffLocation: "TBC",
      scheduledDeparture: "TBC",
      scheduledArrival: "TBC",
      driverName: null,
      driverPhone: null,
      plateNumber: null,
    };

    addTrip(newTrip);
    return NextResponse.json(newTrip, { status: 201 });
  } catch (error) {
    console.error("POST /api/trips/adhoc error:", error);
    return NextResponse.json(
      { error: "Failed to create ad-hoc trip" },
      { status: 500 },
    );
  }
}
