/**
 * @file CSV upload API route — `POST /api/trips/upload`.
 *
 * Accepts a `multipart/form-data` request containing a single `.csv` file.
 * Each data row is matched against the existing trip roster by Bus Identifier +
 * Conference Day + Service Name:
 * - **Match found** → fields from the row are merged into the existing trip.
 * - **No match, bus ID present** → a new trip is created from the row data.
 * - **No bus ID** → the row is skipped.
 *
 * Limits: 512 KB file size, 500 rows per upload.
 *
 * Protected by the proxy authentication layer (admin token required).
 */
import type { TripWithRoute } from "@/hooks/useLiveFleet";
import { addTrip, getTrips, updateTrip } from "@/lib/tripStore";
import { NextRequest, NextResponse } from "next/server";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function col(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    if (row[k]) return row[k];
  }
  return "";
}

function buildPatch(row: Record<string, string>): Partial<TripWithRoute> {
  const patch: Partial<TripWithRoute> = {};
  if (col(row, "drivername", "driver"))
    patch.driverName = col(row, "drivername", "driver");
  if (col(row, "driverphone", "phone"))
    patch.driverPhone = col(row, "driverphone", "phone");
  if (col(row, "platenumber", "plate"))
    patch.plateNumber = col(row, "platenumber", "plate");
  if (col(row, "maxcapacity", "cap"))
    patch.maxCapacity = Number(col(row, "maxcapacity", "cap"));
  if (col(row, "pickuplocation", "from"))
    patch.pickupLocation = col(row, "pickuplocation", "from");
  if (col(row, "dropofflocation", "to"))
    patch.dropoffLocation = col(row, "dropofflocation", "to");
  if (col(row, "scheduleddeparture", "dep"))
    patch.scheduledDeparture = col(row, "scheduleddeparture", "dep");
  if (col(row, "scheduledarrival", "arv"))
    patch.scheduledArrival = col(row, "scheduledarrival", "arv");
  if (col(row, "operationalnote", "note"))
    patch.operationalNote = col(row, "operationalnote", "note");
  if (row.pax) patch.currentPax = Number(row.pax);
  return patch;
}

function buildNewTrip(
  row: Record<string, string>,
  index: number,
  existingTrips: TripWithRoute[],
): TripWithRoute {
  return {
    id: `csv-${crypto.randomUUID()}`,
    routeId: `csv-route-${index}`,
    busIdentifier: col(row, "busidentifier", "bus", "id") || `Bus ${index}`,
    maxCapacity: Number(col(row, "maxcapacity", "cap")) || 40,
    currentPax: Number(row.pax) || 0,
    assignedLoCount: Number(row.lo) || 1,
    status: "scheduled",
    actualDepartureTime: null,
    actualArrivalTime: null,
    operationalNote: col(row, "operationalnote", "note") || null,
    isSos: false,
    sosMessage: null,
    isAdhoc: false,
    conferenceDay:
      col(row, "conferenceday", "day") ||
      existingTrips[0]?.conferenceDay ||
      "7 Sep (Mon)",
    serviceName:
      col(row, "servicename", "service", "svc") || "Uploaded Service",
    targetArrival: col(row, "targetarrival", "arr") || "—",
    pickupLocation: col(row, "pickuplocation", "from") || "TBC",
    dropoffLocation: col(row, "dropofflocation", "to") || "TBC",
    scheduledDeparture: col(row, "scheduleddeparture", "dep") || "TBC",
    scheduledArrival: col(row, "scheduledarrival", "arv") || "TBC",
    driverName: col(row, "drivername", "driver") || null,
    driverPhone: col(row, "driverphone", "phone") || null,
    plateNumber: col(row, "platenumber", "plate") || null,
  };
}

function processRow(
  row: Record<string, string>,
  index: number,
  existingTrips: TripWithRoute[],
): { updated: boolean; created: boolean } {
  const busId = col(row, "busidentifier", "bus", "id");
  const matchIdx = existingTrips.findIndex(
    (t) =>
      t.busIdentifier === busId &&
      t.conferenceDay === col(row, "conferenceday", "day") &&
      t.serviceName === col(row, "servicename", "service", "svc"),
  );

  if (matchIdx >= 0) {
    updateTrip(existingTrips[matchIdx].id, buildPatch(row));
    return { updated: true, created: false };
  }

  if (busId) {
    addTrip(buildNewTrip(row, index, existingTrips));
    return { updated: false, created: true };
  }

  return { updated: false, created: false };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No CSV file provided" },
        { status: 400 },
      );
    }

    // Size limit: 1 MB to prevent OOM
    if (file.size > 1_048_576) {
      return NextResponse.json(
        { error: "File too large (max 1 MB)" },
        { status: 400 },
      );
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

    // Row limit: max 500 data rows
    if (lines.length > 501) {
      return NextResponse.json(
        { error: "Too many rows (max 500 data rows)" },
        { status: 400 },
      );
    }

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must have a header row and at least one data row" },
        { status: 400 },
      );
    }

    const headers = parseCsvLine(lines[0]).map((h) =>
      h.toLowerCase().replace(/\s+/g, ""),
    );
    const existingTrips = getTrips();
    let updated = 0;
    let created = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] ?? "";
      });
      const result = processRow(row, i, existingTrips);
      if (result.updated) updated++;
      if (result.created) created++;
    }

    return NextResponse.json({
      message: `Processed ${lines.length - 1} rows: ${updated} updated, ${created} created`,
      updated,
      created,
    });
  } catch (error) {
    console.error("POST /api/trips/upload error:", error);
    return NextResponse.json(
      { error: "Failed to process CSV" },
      { status: 500 },
    );
  }
}
