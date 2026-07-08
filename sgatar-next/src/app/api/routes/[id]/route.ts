/**
 * @file App Router route handlers for `/api/routes/[id]`.
 *
 * Exposes update and delete operations for a single master route.
 */
import { db } from "@/db";
import { routes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

interface RoutePatchBody {
  conferenceDay?: string;
  serviceName?: string;
  targetArrival?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  scheduledDeparture?: string;
  scheduledArrival?: string;
  defaultCapacity?: number;
  routeType?: string | null;
  flightNumber?: string | null;
  terminal?: string | null;
  pickupInstructions?: string | null;
}

function buildPatchData(body: RoutePatchBody) {
  const patch: Record<string, unknown> = {};

  if (body.conferenceDay !== undefined) {
    patch.conferenceDay = body.conferenceDay.trim();
  }
  if (body.serviceName !== undefined) {
    patch.serviceName = body.serviceName.trim();
  }
  if (body.targetArrival !== undefined) {
    patch.targetArrival = body.targetArrival.trim();
  }
  if (body.pickupLocation !== undefined) {
    patch.pickupLocation = body.pickupLocation.trim();
  }
  if (body.dropoffLocation !== undefined) {
    patch.dropoffLocation = body.dropoffLocation.trim();
  }
  if (body.scheduledDeparture !== undefined) {
    patch.scheduledDeparture = body.scheduledDeparture.trim();
  }
  if (body.scheduledArrival !== undefined) {
    patch.scheduledArrival = body.scheduledArrival.trim();
  }
  if (body.defaultCapacity !== undefined) {
    patch.defaultCapacity = body.defaultCapacity;
  }
  if (body.routeType !== undefined) {
    patch.routeType = body.routeType?.trim() || null;
  }
  if (body.flightNumber !== undefined) {
    patch.flightNumber = body.flightNumber?.trim() || null;
  }
  if (body.terminal !== undefined) {
    patch.terminal = body.terminal?.trim() || null;
  }
  if (body.pickupInstructions !== undefined) {
    patch.pickupInstructions = body.pickupInstructions?.trim() || null;
  }

  return patch;
}

/** Updates the specified master route. */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as RoutePatchBody;
    const patch = buildPatchData(body);

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "No fields provided for update" },
        { status: 400 },
      );
    }

    const updatedRows = await db
      .update(routes)
      .set(patch)
      .where(eq(routes.id, id))
      .returning();

    if (updatedRows.length === 0) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    const updated = updatedRows[0];
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/routes/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update route" },
      { status: 500 },
    );
  }
}

/** Deletes the specified master route. */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const deletedRows = await db
      .delete(routes)
      .where(eq(routes.id, id))
      .returning({ id: routes.id });

    if (deletedRows.length === 0) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/routes/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete route" },
      { status: 500 },
    );
  }
}
