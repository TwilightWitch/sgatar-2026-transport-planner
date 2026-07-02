/**
 * @file Ad-hoc bus API route — `POST /api/trips/adhoc`.
 *
 * Creates an unplanned "ghost bus" tagged `isAdhoc: true` and adds it to the
 * live roster immediately.
 */
import type { TripWithRoute } from "@/hooks/useLiveFleet";
import { addTrip, getTrips } from "@/lib/tripStore";
import type { NextApiRequest, NextApiResponse } from "next";

interface AdhocBody {
  routeId: string;
  busIdentifier: string;
  maxCapacity?: number;
  operationalNote?: string;
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
    const body = req.body as AdhocBody;

    if (!body.routeId || typeof body.routeId !== "string") {
      res.status(400).json({ error: "routeId is required" });
      return;
    }
    if (!body.busIdentifier || typeof body.busIdentifier !== "string") {
      res.status(400).json({ error: "busIdentifier is required" });
      return;
    }

    const capacity = body.maxCapacity ?? 40;
    if (capacity < 1 || capacity > 100) {
      res.status(400).json({ error: "maxCapacity must be between 1 and 100" });
      return;
    }

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

        res.status(201).json(newTrip);
        return;
      } catch (error) {
        console.error("POST adhoc DB error, falling back:", error);
      }
    }

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
      targetArrival: "-",
      pickupLocation: "TBC",
      dropoffLocation: "TBC",
      scheduledDeparture: "TBC",
      scheduledArrival: "TBC",
      driverName: null,
      driverPhone: null,
      plateNumber: null,
    };

    addTrip(newTrip);
    res.status(201).json(newTrip);
  } catch (error) {
    console.error("POST /api/trips/adhoc error:", error);
    res.status(500).json({ error: "Failed to create ad-hoc trip" });
  }
}
