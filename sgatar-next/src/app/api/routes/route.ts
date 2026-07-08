/**
 * @file App Router route handlers for `/api/routes`.
 *
 * Exposes read and create operations for master schedule routes.
 */
import { db } from "@/db";
import { routes } from "@/db/schema";
import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";

interface RouteBody {
  conferenceDay: string;
  serviceName: string;
  targetArrival: string;
  pickupLocation: string;
  dropoffLocation: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  defaultCapacity: number;
  routeType?: string | null;
  flightNumber?: string | null;
  terminal?: string | null;
  pickupInstructions?: string | null;
}

/** Returns all master routes in a stable day/time/service order. */
export async function GET() {
  try {
    const records = await db
      .select()
      .from(routes)
      .orderBy(
        asc(routes.conferenceDay),
        asc(routes.scheduledDeparture),
        asc(routes.serviceName),
      );

    return NextResponse.json(records, { status: 200 });
  } catch (error) {
    console.error("GET /api/routes error:", error);
    return NextResponse.json(
      { error: "Failed to load master routes" },
      { status: 500 },
    );
  }
}

function isValidCreatePayload(body: RouteBody): boolean {
  return (
    body.conferenceDay.trim().length > 0 &&
    body.serviceName.trim().length > 0 &&
    body.targetArrival.trim().length > 0 &&
    body.pickupLocation.trim().length > 0 &&
    body.dropoffLocation.trim().length > 0 &&
    body.scheduledDeparture.trim().length > 0 &&
    body.scheduledArrival.trim().length > 0 &&
    Number.isFinite(body.defaultCapacity) &&
    body.defaultCapacity > 0
  );
}

/** Creates a new master route definition. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RouteBody;

    if (!isValidCreatePayload(body)) {
      return NextResponse.json(
        { error: "Invalid route payload" },
        { status: 400 },
      );
    }

    const [created] = await db
      .insert(routes)
      .values({
        conferenceDay: body.conferenceDay.trim(),
        serviceName: body.serviceName.trim(),
        targetArrival: body.targetArrival.trim(),
        pickupLocation: body.pickupLocation.trim(),
        dropoffLocation: body.dropoffLocation.trim(),
        scheduledDeparture: body.scheduledDeparture.trim(),
        scheduledArrival: body.scheduledArrival.trim(),
        defaultCapacity: body.defaultCapacity,
        routeType: body.routeType?.trim() || "shuttle",
        flightNumber: body.flightNumber?.trim() || null,
        terminal: body.terminal?.trim() || null,
        pickupInstructions: body.pickupInstructions?.trim() || null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/routes error:", error);
    return NextResponse.json(
      { error: "Failed to create route" },
      { status: 500 },
    );
  }
}
