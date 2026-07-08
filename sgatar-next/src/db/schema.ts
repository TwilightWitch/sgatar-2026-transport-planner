/**
 * @file Drizzle ORM schema definitions.
 *
 * Defines three tables:
 * - `routes`         — The canonical set of planned bus routes (day, service, pickup/dropoff, times,
 *                      route type, and airport-specific metadata).
 * - `active_trips`   — Live, mutable instances of a route for an event day (one row per physical
 *                      bus), including driver details, delegation binding, and SOS state.
 * - `headcount_logs` — Append-only audit log of every headcount change recorded by LOs, including
 *                      the milestone status at the moment of recording for operational analytics.
 *
 * Generated TypeScript types are re-exported at the bottom of the file.
 */
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

/**
 * Enumeration of trip lifecycle statuses.
 *
 * Progression model:
 *   scheduled → boarding → departed_origin → en_route → arrived_destination → completed
 *   (or → delayed at any stage before completion)
 */
export const tripStatusEnum = pgEnum("trip_status", [
  "scheduled",
  "boarding",
  "departed_origin",
  "en_route",
  "delayed",
  "arrived_destination",
  "completed",
]);

/**
 * Canonical route definitions — one row per planned service.
 *
 * `routeType` distinguishes regular conference shuttles from airport transfer legs,
 * enabling the delegate portal to render separate "Daily Shuttles" vs "Airport Transfers" tabs.
 */
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
  /** Discriminates shuttle vs airport arrival/departure legs. Defaults to 'shuttle'. */
  routeType: varchar("route_type", { length: 32 }).default("shuttle"),
  /** IATA flight number — populated for airport_arrival and airport_departure routes only. */
  flightNumber: varchar("flight_number", { length: 32 }),
  /** Airport terminal identifier (e.g. "T1", "T2", "T3") for airport transfer routes. */
  terminal: varchar("terminal", { length: 16 }),
  /** Human-readable wayfinding instruction shown to delegates (e.g. "Changi T3 Arrival Hall"). */
  pickupInstructions: text("pickup_instructions"),
});

/**
 * Active trip instances — one row per physical bus operating a route on an event day.
 *
 * Extends the route with runtime mutable state: driver identity, headcount, milestone status,
 * SOS flag, delegation binding, and ad-hoc origin flag.
 */
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
  /** Name of the assigned driver for LO reference. */
  driverName: varchar("driver_name", { length: 64 }),
  /** Contact phone number of the assigned driver. */
  driverPhone: varchar("driver_phone", { length: 32 }),
  /** Name of the liaison officer currently assigned to this bus. */
  loName: varchar("lo_name", { length: 64 }),
  /** Phone number of the liaison officer currently assigned to this bus. */
  loPhone: varchar("lo_phone", { length: 32 }),
  /** Vehicle registration plate displayed on LO and admin dashboards. */
  plateNumber: varchar("plate_number", { length: 16 }),
  /**
   * Array of ISO 3166-1 alpha-3 delegation country codes bound to this trip.
   * NULL / empty means the trip is in the general pool visible to all delegates.
   */
  assignedDelegations: text("assigned_delegations").array(),
  /** Free-text SOS message recorded when `isSos` is set to true by an LO. */
  sosMessage: text("sos_message"),
});

/**
 * Append-only headcount change log for every LO update.
 *
 * `statusContext` captures the trip milestone at the moment of recording so
 * operations can correlate headcount fluctuations with journey phase analytics.
 */
export const headcountLogs = pgTable("headcount_logs", {
  id: serial("id").primaryKey(),
  tripId: uuid("trip_id")
    .references(() => activeTrips.id, { onDelete: "cascade" })
    .notNull(),
  paxDelta: integer("pax_delta").notNull(),
  recordedPax: integer("recorded_pax").notNull(),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
  /** Trip milestone status at the time this log entry was created. */
  statusContext: tripStatusEnum("status_context").notNull(),
});

export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;
export type ActiveTrip = typeof activeTrips.$inferSelect;
export type NewActiveTrip = typeof activeTrips.$inferInsert;
export type HeadcountLog = typeof headcountLogs.$inferSelect;
/** Union of all valid trip status strings derived from the DB enum. */
export type TripStatus = (typeof tripStatusEnum.enumValues)[number];
