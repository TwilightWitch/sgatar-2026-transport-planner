import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  time,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const tripStatusEnum = pgEnum("trip_status", [
  "scheduled",
  "boarding",
  "en_route",
  "delayed",
  "completed",
]);

export const routes = pgTable("routes", {
  id: uuid("id").defaultRandom().primaryKey(),
  conferenceDay: varchar("conference_day", { length: 32 }).notNull(),
  serviceName: text("service_name").notNull(),
  targetArrival: varchar("target_arrival", { length: 10 }).notNull(),
  pickupLocation: text("pickup_location").notNull(),
  dropoffLocation: text("dropoff_location").notNull(),
  scheduledDeparture: time("scheduled_departure").notNull(),
  scheduledArrival: varchar("scheduled_arrival", { length: 10 }).notNull(),
  defaultCapacity: integer("default_capacity").default(40).notNull(),
});

export const activeTrips = pgTable("active_trips", {
  id: uuid("id").defaultRandom().primaryKey(),
  routeId: uuid("route_id")
    .references(() => routes.id)
    .notNull(),
  busIdentifier: varchar("bus_identifier", { length: 32 }).notNull(),
  maxCapacity: integer("max_capacity").notNull(),
  currentPax: integer("current_pax").default(0).notNull(),
  assignedLoCount: integer("assigned_lo_count").default(1).notNull(),
  status: tripStatusEnum("status").default("scheduled").notNull(),
  actualDepartureTime: timestamp("actual_departure_time"),
  actualArrivalTime: timestamp("actual_arrival_time"),
  operationalNote: text("operational_note"),
  isSos: boolean("is_sos").default(false).notNull(),
  isAdhoc: boolean("is_adhoc").default(false).notNull(),
});

export const headcountLogs = pgTable("headcount_logs", {
  id: serial("id").primaryKey(),
  tripId: uuid("trip_id")
    .references(() => activeTrips.id)
    .notNull(),
  paxDelta: integer("pax_delta").notNull(),
  recordedPax: integer("recorded_pax").notNull(),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
});

export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;
export type ActiveTrip = typeof activeTrips.$inferSelect;
export type NewActiveTrip = typeof activeTrips.$inferInsert;
export type HeadcountLog = typeof headcountLogs.$inferSelect;
