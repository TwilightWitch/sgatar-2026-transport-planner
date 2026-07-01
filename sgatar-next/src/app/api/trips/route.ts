import { getTrips } from "@/lib/tripStore";
import { NextResponse } from "next/server";

export async function GET() {
  // If DATABASE_URL is configured, try to load from live DB
  if (process.env.DATABASE_URL) {
    try {
      const { db } = await import("@/db");
      const { activeTrips, routes } = await import("@/db/schema");
      const { eq } = await import("drizzle-orm");

      const trips = await db
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
          conferenceDay: routes.conferenceDay,
          serviceName: routes.serviceName,
          targetArrival: routes.targetArrival,
          pickupLocation: routes.pickupLocation,
          dropoffLocation: routes.dropoffLocation,
          scheduledDeparture: routes.scheduledDeparture,
          scheduledArrival: routes.scheduledArrival,
        })
        .from(activeTrips)
        .innerJoin(routes, eq(activeTrips.routeId, routes.id));

      return NextResponse.json(trips);
    } catch (error) {
      console.error("GET /api/trips DB error, falling back to static:", error);
    }
  }

  // Fallback: return in-memory mutable schedule
  return NextResponse.json(getTrips());
}
