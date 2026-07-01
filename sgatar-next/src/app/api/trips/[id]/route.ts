import { deleteTrip, updateTrip } from "@/lib/tripStore";
import { NextRequest, NextResponse } from "next/server";

interface PatchBody {
  currentPax?: number;
  status?: "scheduled" | "boarding" | "en_route" | "delayed" | "completed";
  operationalNote?: string;
  isSos?: boolean;
  sosMessage?: string | null;
  assignedLoCount?: number;
  busIdentifier?: string;
  maxCapacity?: number;
  scheduledDeparture?: string;
  scheduledArrival?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  serviceName?: string;
  conferenceDay?: string;
  targetArrival?: string;
  driverName?: string | null;
  driverPhone?: string | null;
  plateNumber?: string | null;
}

const VALID_STATUSES = new Set([
  "scheduled",
  "boarding",
  "en_route",
  "delayed",
  "completed",
]);

function validatePatchBody(body: PatchBody): string | null {
  if (body.currentPax !== undefined) {
    if (typeof body.currentPax !== "number" || body.currentPax < 0) {
      return "currentPax must be a non-negative number";
    }
  }
  if (body.status !== undefined && !VALID_STATUSES.has(body.status)) {
    return "Invalid status value";
  }
  return null;
}

function buildDbUpdateData(body: PatchBody): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (body.currentPax !== undefined) data.currentPax = body.currentPax;
  if (body.status !== undefined) {
    data.status = body.status;
    if (body.status === "en_route") data.actualDepartureTime = new Date();
    if (body.status === "completed") data.actualArrivalTime = new Date();
  }
  if (body.operationalNote !== undefined)
    data.operationalNote = body.operationalNote;
  if (body.isSos !== undefined) data.isSos = body.isSos;
  if (body.assignedLoCount !== undefined)
    data.assignedLoCount = body.assignedLoCount;
  return data;
}

async function patchViaDb(
  id: string,
  body: PatchBody,
): Promise<NextResponse | null> {
  try {
    const { db } = await import("@/db");
    const { activeTrips } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const updateData = buildDbUpdateData(body);
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(activeTrips)
      .set(updateData)
      .where(eq(activeTrips.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH DB error, falling back to in-memory:", error);
    return null;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as PatchBody;

    const validationError = validatePatchBody(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (process.env.DATABASE_URL) {
      const dbResult = await patchViaDb(id, body);
      if (dbResult) return dbResult;
    }

    // Fallback: update in-memory store
    const updated = updateTrip(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/trips/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update trip" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const deleted = deleteTrip(id);
  if (!deleted) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
