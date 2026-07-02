/**
 * @file Single-trip API routes — `PATCH /api/trips/[id]` and `DELETE /api/trips/[id]`.
 *
 * PATCH: Partially updates a trip (headcount, status, SOS, schedule, driver).
 * DELETE: Removes a trip from the active roster.
 */
import { deleteTrip, updateTrip } from "@/lib/tripStore";
import type { NextApiRequest, NextApiResponse } from "next";

const VALID_STATUSES = new Set([
  "scheduled",
  "boarding",
  "en_route",
  "delayed",
  "completed",
]);

interface PatchBody {
  currentPax?: number;
  status?: string;
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
  // sosMessage is not a DB column — it lives in the in-memory store only
  if (body.assignedLoCount !== undefined)
    data.assignedLoCount = body.assignedLoCount;
  return data;
}

async function patchViaDb(
  id: string,
  body: PatchBody,
  res: NextApiResponse,
): Promise<boolean> {
  try {
    const { db } = await import("@/db");
    const { activeTrips } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const updateData = buildDbUpdateData(body);
    if (Object.keys(updateData).length === 0) {
      // No DB-eligible fields in this patch (e.g. driver fields, sosMessage).
      // Fall through so the in-memory store handles them.
      return false;
    }

    const [updated] = await db
      .update(activeTrips)
      .set(updateData)
      .where(eq(activeTrips.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Trip not found" });
      return true;
    }
    res.json(updated);
    return true;
  } catch (error) {
    console.error("PATCH DB error, falling back to in-memory:", error);
    return false;
  }
}

async function handlePatch(
  id: string,
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  const body = req.body as PatchBody;

  if (body.currentPax !== undefined) {
    if (typeof body.currentPax !== "number" || body.currentPax < 0) {
      res
        .status(400)
        .json({ error: "currentPax must be a non-negative number" });
      return;
    }
  }
  if (body.status !== undefined && !VALID_STATUSES.has(body.status)) {
    res.status(400).json({ error: "Invalid status value" });
    return;
  }

  if (process.env.DATABASE_URL) {
    const handled = await patchViaDb(id, body, res);
    if (handled) return;
  }

  const updated = updateTrip(id, body as Parameters<typeof updateTrip>[1]);
  if (!updated) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  res.json(updated);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  const id = req.query.id as string;

  if (req.method === "PATCH") {
    await handlePatch(id, req, res);
    return;
  }

  if (req.method === "DELETE") {
    const deleted = deleteTrip(id);
    if (!deleted) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }
    res.json({ success: true });
    return;
  }

  res.status(405).end("Method Not Allowed");
}
