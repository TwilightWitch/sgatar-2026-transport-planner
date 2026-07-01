import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { activeTrips, headcountLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

interface PatchBody {
  currentPax?: number;
  status?: "scheduled" | "boarding" | "en_route" | "delayed" | "completed";
  operationalNote?: string;
  isSos?: boolean;
  assignedLoCount?: number;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as PatchBody;

    const updateData: Record<string, unknown> = {};

    if (body.currentPax !== undefined) {
      if (typeof body.currentPax !== "number" || body.currentPax < 0) {
        return NextResponse.json(
          { error: "currentPax must be a non-negative number" },
          { status: 400 }
        );
      }
      updateData.currentPax = body.currentPax;
    }

    if (body.status !== undefined) {
      const validStatuses = [
        "scheduled",
        "boarding",
        "en_route",
        "delayed",
        "completed",
      ];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid status value" },
          { status: 400 }
        );
      }
      updateData.status = body.status;

      if (body.status === "en_route") {
        updateData.actualDepartureTime = new Date();
      }
      if (body.status === "completed") {
        updateData.actualArrivalTime = new Date();
      }
    }

    if (body.operationalNote !== undefined) {
      updateData.operationalNote = body.operationalNote;
    }

    if (body.isSos !== undefined) {
      updateData.isSos = body.isSos;
    }

    if (body.assignedLoCount !== undefined) {
      updateData.assignedLoCount = body.assignedLoCount;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 }
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

    // Log headcount change if pax was updated
    if (body.currentPax !== undefined) {
      const previousPax = updated.currentPax - (body.currentPax - (updated.currentPax ?? 0));
      await db.insert(headcountLogs).values({
        tripId: id,
        paxDelta: body.currentPax - previousPax,
        recordedPax: body.currentPax,
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/trips/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update trip" },
      { status: 500 }
    );
  }
}
