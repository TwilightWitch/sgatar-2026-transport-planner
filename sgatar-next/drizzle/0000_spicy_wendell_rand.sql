CREATE TYPE "public"."trip_status" AS ENUM('scheduled', 'boarding', 'departed_origin', 'en_route', 'delayed', 'arrived_destination', 'completed');--> statement-breakpoint
CREATE TABLE "active_trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_id" uuid NOT NULL,
	"bus_identifier" varchar(32) NOT NULL,
	"max_capacity" integer NOT NULL,
	"current_pax" integer DEFAULT 0 NOT NULL,
	"assigned_lo_count" integer DEFAULT 1 NOT NULL,
	"status" "trip_status" DEFAULT 'scheduled' NOT NULL,
	"actual_departure_time" timestamp,
	"actual_arrival_time" timestamp,
	"operational_note" text,
	"is_sos" boolean DEFAULT false NOT NULL,
	"is_adhoc" boolean DEFAULT false NOT NULL,
	"driver_name" varchar(64),
	"driver_phone" varchar(32),
	"lo_name" varchar(64),
	"lo_phone" varchar(32),
	"plate_number" varchar(16),
	"assigned_delegations" text[],
	"sos_message" text
);
--> statement-breakpoint
CREATE TABLE "headcount_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_id" uuid NOT NULL,
	"pax_delta" integer NOT NULL,
	"recorded_pax" integer NOT NULL,
	"logged_at" timestamp DEFAULT now() NOT NULL,
	"status_context" "trip_status" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conference_day" varchar(32) NOT NULL,
	"service_name" text NOT NULL,
	"target_arrival" varchar(10) NOT NULL,
	"pickup_location" text NOT NULL,
	"dropoff_location" text NOT NULL,
	"scheduled_departure" time NOT NULL,
	"scheduled_arrival" varchar(10) NOT NULL,
	"default_capacity" integer DEFAULT 40 NOT NULL,
	"route_type" varchar(32) DEFAULT 'shuttle',
	"flight_number" varchar(32),
	"terminal" varchar(16),
	"pickup_instructions" text
);
--> statement-breakpoint
ALTER TABLE "active_trips" ADD CONSTRAINT "active_trips_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "headcount_logs" ADD CONSTRAINT "headcount_logs_trip_id_active_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."active_trips"("id") ON DELETE cascade ON UPDATE no action;