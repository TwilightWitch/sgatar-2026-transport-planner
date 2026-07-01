import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { activeTrips, routes } from "./schema";

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  console.log("Seeding routes...");

  const seedRoutes = [
    {
      conferenceDay: "7 Sep (Mon)",
      serviceName: "Hotels → MBS (Welcome Reception)",
      targetArrival: "17:00",
      pickupLocation: "Rendezvous Hotel",
      dropoffLocation: "MBS Convention Centre",
      scheduledDeparture: "16:30",
      scheduledArrival: "16:50",
      defaultCapacity: 40,
    },
    {
      conferenceDay: "7 Sep (Mon)",
      serviceName: "Hotels → MBS (Welcome Reception)",
      targetArrival: "17:00",
      pickupLocation: "Parkroyal on Beach Road",
      dropoffLocation: "MBS Convention Centre",
      scheduledDeparture: "16:30",
      scheduledArrival: "16:50",
      defaultCapacity: 40,
    },
    {
      conferenceDay: "7 Sep (Mon)",
      serviceName: "MBS → Hotels (Return)",
      targetArrival: "—",
      pickupLocation: "MBS Convention Centre",
      dropoffLocation: "Rendezvous Hotel",
      scheduledDeparture: "21:00",
      scheduledArrival: "21:20",
      defaultCapacity: 40,
    },
    {
      conferenceDay: "7 Sep (Mon)",
      serviceName: "MBS → Hotels (Return)",
      targetArrival: "—",
      pickupLocation: "MBS Convention Centre",
      dropoffLocation: "Parkroyal on Beach Road",
      scheduledDeparture: "21:00",
      scheduledArrival: "21:20",
      defaultCapacity: 40,
    },
    {
      conferenceDay: "8 Sep (Tue)",
      serviceName: "Hotels → MBS (Morning)",
      targetArrival: "08:45",
      pickupLocation: "Rendezvous Hotel",
      dropoffLocation: "MBS Convention Centre",
      scheduledDeparture: "08:00",
      scheduledArrival: "08:20",
      defaultCapacity: 40,
    },
    {
      conferenceDay: "8 Sep (Tue)",
      serviceName: "Hotels → MBS (Morning)",
      targetArrival: "08:45",
      pickupLocation: "Parkroyal on Beach Road",
      dropoffLocation: "MBS Convention Centre",
      scheduledDeparture: "08:00",
      scheduledArrival: "08:20",
      defaultCapacity: 40,
    },
    {
      conferenceDay: "8 Sep (Tue)",
      serviceName: "MBS → Straits Kitchen (Opening Dinner)",
      targetArrival: "18:45",
      pickupLocation: "MBS Convention Centre",
      dropoffLocation: "Straits Kitchen",
      scheduledDeparture: "18:05",
      scheduledArrival: "18:30",
      defaultCapacity: 40,
    },
    {
      conferenceDay: "9 Sep (Wed)",
      serviceName: "Hotels → MBS (Morning)",
      targetArrival: "08:45",
      pickupLocation: "Rendezvous Hotel",
      dropoffLocation: "MBS Convention Centre",
      scheduledDeparture: "08:00",
      scheduledArrival: "08:20",
      defaultCapacity: 40,
    },
    {
      conferenceDay: "9 Sep (Wed)",
      serviceName: "Hotels → Night Safari",
      targetArrival: "18:30",
      pickupLocation: "Rendezvous Hotel",
      dropoffLocation: "Night Safari",
      scheduledDeparture: "17:30",
      scheduledArrival: "18:15",
      defaultCapacity: 40,
    },
    {
      conferenceDay: "9 Sep (Wed)",
      serviceName: "Night Safari → Hotels (Return)",
      targetArrival: "—",
      pickupLocation: "Night Safari",
      dropoffLocation: "Rendezvous Hotel",
      scheduledDeparture: "21:30",
      scheduledArrival: "22:15",
      defaultCapacity: 40,
    },
    {
      conferenceDay: "10 Sep (Thu)",
      serviceName: "Hotels → MBS (Morning)",
      targetArrival: "08:45",
      pickupLocation: "Rendezvous Hotel",
      dropoffLocation: "MBS Convention Centre",
      scheduledDeparture: "08:00",
      scheduledArrival: "08:20",
      defaultCapacity: 40,
    },
    {
      conferenceDay: "10 Sep (Thu)",
      serviceName: "Shuttle Loop (Continuous)",
      targetArrival: "—",
      pickupLocation: "MBS Convention Centre",
      dropoffLocation: "Hotels (Loop)",
      scheduledDeparture: "12:00",
      scheduledArrival: "12:30",
      defaultCapacity: 40,
    },
  ];

  const insertedRoutes = await db.insert(routes).values(seedRoutes).returning();

  console.log(`Inserted ${insertedRoutes.length} routes.`);

  // Seed initial active trips for the first operational day
  const day1Routes = insertedRoutes.filter(
    (r) => r.conferenceDay === "7 Sep (Mon)",
  );

  const initialTrips = day1Routes.flatMap((route, idx) => [
    {
      routeId: route.id,
      busIdentifier: `BUS-${String(idx * 2 + 1).padStart(2, "0")}`,
      maxCapacity: route.defaultCapacity,
      currentPax: 0,
      assignedLoCount: 1,
      status: "scheduled" as const,
      isSos: false,
      isAdhoc: false,
    },
    {
      routeId: route.id,
      busIdentifier: `BUS-${String(idx * 2 + 2).padStart(2, "0")}`,
      maxCapacity: route.defaultCapacity,
      currentPax: 0,
      assignedLoCount: 1,
      status: "scheduled" as const,
      isSos: false,
      isAdhoc: false,
    },
  ]);

  const insertedTrips = await db
    .insert(activeTrips)
    .values(initialTrips)
    .returning();

  console.log(`Inserted ${insertedTrips.length} initial active trips.`);
  console.log("Seeding complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
