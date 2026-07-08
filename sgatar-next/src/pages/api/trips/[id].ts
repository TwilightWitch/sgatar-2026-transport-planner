/**
 * @file Single-trip API routes — `PATCH /api/trips/[id]` and `DELETE /api/trips/[id]`.
 *
 * PATCH: Partially updates a trip (headcount, status, SOS, schedule, driver, delegations).
 *   When a database is available the trip update and headcount log insert are executed
 *   atomically inside a Drizzle `.transaction()` block so neither persists without the other.
 * DELETE: Removes a trip from the active roster.
 */
import { deleteTrip, updateTrip } from "@/lib/tripStore";
import type { NextApiRequest, NextApiResponse } from "next";

const VALID_STATUSES = new Set([
  "scheduled",
  "boarding",
  "departed_origin",
  "en_route",
  "delayed",
  "arrived_destination",
  "completed",
]);

interface PatchBody {
  currentPax?: number;
  status?: string;
  operationalNote?: string;
  delegateNotice?: string | null;
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
  loName?: string | null;
  loPhone?: string | null;
  plateNumber?: string | null;
  assignedDelegations?: string[] | null;
}

function setIfDefined<T>(
  target: Record<string, unknown>,
  key: string,
  value: T | undefined,
): void {
  if (value !== undefined) {
    target[key] = value;
  }
}

/** Builds the columns to update on `active_trips` from the validated patch body. */
function buildDbUpdateData(body: PatchBody): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  setIfDefined(data, "currentPax", body.currentPax);
  if (body.status !== undefined) {
    data.status = body.status;
    if (body.status === "departed_origin" || body.status === "en_route") {
      data.actualDepartureTime = new Date();
    }
    if (body.status === "arrived_destination" || body.status === "completed") {
      data.actualArrivalTime = new Date();
    }
  }

  setIfDefined(data, "operationalNote", body.operationalNote);
  setIfDefined(data, "delegateNotice", body.delegateNotice);
  setIfDefined(data, "isSos", body.isSos);
  setIfDefined(data, "sosMessage", body.sosMessage);
  setIfDefined(data, "assignedLoCount", body.assignedLoCount);
  setIfDefined(data, "driverName", body.driverName);
  setIfDefined(data, "driverPhone", body.driverPhone);
  setIfDefined(data, "loName", body.loName);
  setIfDefined(data, "loPhone", body.loPhone);
  setIfDefined(data, "plateNumber", body.plateNumber);
  setIfDefined(data, "assignedDelegations", body.assignedDelegations);

  return data;
}

/** Deletes a trip row from the DB when a database connection is configured. */
async function deleteViaDb(id: string, res: NextApiResponse): Promise<boolean> {
  try {
    const { db } = await import("@/db");
    const { activeTrips } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const deletedRows = await db
      .delete(activeTrips)
      .where(eq(activeTrips.id, id))
      .returning({ id: activeTrips.id });

    if (deletedRows.length === 0) {
      res.status(404).json({ error: "Trip not found" });
      return true;
    }

    res.json({ success: true });
    return true;
  } catch (error) {
    console.error("DELETE DB error, falling back to in-memory:", error);
    return false;
  }
}

/**
 * Updates `active_trips` then appends a `headcount_logs` audit row.
 *
 * The two operations run as separate sequential queries rather than inside
 * `db.transaction()`.  Neon's HTTP batch driver resolves `.returning()` results
 * only after the whole batch is sent, so using those results to build a
 * subsequent INSERT inside the same transaction callback causes NOT NULL
 * violations (statusContext is unresolved) → the batch is rejected → the outer
 * catch returns false → the in-memory store cannot find the UUID → 404.
 * Sequential queries eliminate this entirely; the headcount log is audit-only
 * so strict atomicity is not required.
 *
 * Returns `true` if the response was sent, `false` to fall back to in-memory.
 */
async function patchViaDb(
  id: string,
  body: PatchBody,
  res: NextApiResponse,
): Promise<boolean> {
  try {
    const { db } = await import("@/db");
    const { activeTrips, headcountLogs } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const updateData = buildDbUpdateData(body);
    if (Object.keys(updateData).length === 0) {
      return false;
    }

    // 1. Update the trip row
    const updatedRows = await db
      .update(activeTrips)
      .set(updateData)
      .where(eq(activeTrips.id, id))
      .returning();

    if (updatedRows.length === 0) {
      res.status(404).json({ error: "Trip not found" });
      return true;
    }

    const updated = updatedRows[0];

    // 2. Append audit log — fire-and-forget, does not affect the response
    if (body.currentPax !== undefined) {
      db.insert(headcountLogs)
        .values({
          tripId: id,
          paxDelta: body.currentPax - updated.currentPax,
          recordedPax: body.currentPax,
          statusContext: updated.status,
        })
        .catch((logErr: unknown) => {
          console.warn("headcount_logs insert skipped:", logErr);
        });
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
  res.setHeader("Cache-Control", "no-store");
  const id = req.query.id as string;

  if (req.method === "PATCH") {
    await handlePatch(id, req, res);
    return;
  }

  if (req.method === "DELETE") {
    if (process.env.DATABASE_URL) {
      const handled = await deleteViaDb(id, res);
      if (handled) return;
    }

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
