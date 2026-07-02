/**
 * @file Trips list API route — `GET /api/trips`.
 *
 * Returns all active trips joined with their route metadata.  When
 * `DATABASE_URL` is configured the data is fetched from Neon; otherwise the
 * in-memory static fallback store is used.
 *
 * Polled every 4 seconds by all connected clients via {@link useActiveTrips}.
 */
import { getTrips } from "@/lib/tripStore";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  // Polling endpoint — must never be served from browser or CDN cache.
  res.setHeader("Cache-Control", "no-store");

  if (process.env.DATABASE_URL) {
    try {
      const { db } = await import("@/db");
      const { activeTrips, routes } = await import("@/db/schema");
      const { eq } = await import("drizzle-orm");

      const rawTrips = await db
        .select({
          id: activeTrips.id,
          routeId: activeTrips.routeId,
          busIdentifier: activeTrips.busIdentifier,
          maxCapacity: activeTrips.maxCapacity,
          currentPax: activeTrips.currentPax,
          assignedLoCount: activeTrips.assignedLoCount,
          status: activeTrips.status,
          actualDepartureTime: activeTrips.actualDepartureTime,
          actualArrivalTime: activeTrips.actualArrivalTime,
          operationalNote: activeTrips.operationalNote,
          isSos: activeTrips.isSos,
          isAdhoc: activeTrips.isAdhoc,
          driverName: activeTrips.driverName,
          driverPhone: activeTrips.driverPhone,
          plateNumber: activeTrips.plateNumber,
          assignedDelegations: activeTrips.assignedDelegations,
          sosMessage: activeTrips.sosMessage,
          conferenceDay: routes.conferenceDay,
          serviceName: routes.serviceName,
          targetArrival: routes.targetArrival,
          pickupLocation: routes.pickupLocation,
          dropoffLocation: routes.dropoffLocation,
          scheduledDeparture: routes.scheduledDeparture,
          scheduledArrival: routes.scheduledArrival,
          routeType: routes.routeType,
          flightNumber: routes.flightNumber,
          terminal: routes.terminal,
          pickupInstructions: routes.pickupInstructions,
        })
        .from(activeTrips)
        .innerJoin(routes, eq(activeTrips.routeId, routes.id));

      // Postgres `time` columns are returned as "HH:MM:SS" — normalise to "HH:MM"
      // to match the static schedule format used everywhere in the UI.
      const trips = rawTrips.map((t) => ({
        ...t,
        scheduledDeparture: t.scheduledDeparture.slice(0, 5),
      }));

      res.json(trips);
      return;
    } catch (error) {
      console.error("GET /api/trips DB error, falling back to static:", error);
    }
  }

  res.json(getTrips());
}
