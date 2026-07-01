import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { activeTrips } from "@/db/schema";

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
        { status: 400 }
      );
    }

    if (!body.busIdentifier || typeof body.busIdentifier !== "string") {
      return NextResponse.json(
        { error: "busIdentifier is required" },
        { status: 400 }
      );
    }

    const capacity = body.maxCapacity ?? 40;
    if (capacity < 1 || capacity > 100) {
      return NextResponse.json(
        { error: "maxCapacity must be between 1 and 100" },
        { status: 400 }
      );
    }

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
    console.error("POST /api/trips/adhoc error:", error);
    return NextResponse.json(
      { error: "Failed to create ad-hoc trip" },
      { status: 500 }
    );
  }
}
