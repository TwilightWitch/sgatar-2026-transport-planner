/**
 * @file CSV upload API route — `POST /api/trips/upload`.
 *
 * Accepts `{ csv: string }` JSON containing the raw CSV text.  Each row is
 * matched against the existing roster by Bus Identifier + Conference Day +
 * Service Name; matched rows update the existing trip, unmatched rows with a
 * bus ID create a new trip.
 *
 * Limits: 512 KB body, 500 rows.
 */
import type { TripWithRoute } from "@/hooks/useLiveFleet";
import { addTrip, getTrips, updateTrip } from "@/lib/tripStore";
import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: { bodyParser: { sizeLimit: "512kb" } },
};

interface UploadBody {
  csv: string;
}

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
    targetArrival: col(row, "targetarrival", "arr") || "-",
    pickupLocation: col(row, "pickuplocation", "from") || "TBC",
    dropoffLocation: col(row, "dropofflocation", "to") || "TBC",
    scheduledDeparture: col(row, "scheduleddeparture", "dep") || "TBC",
    scheduledArrival: col(row, "scheduledarrival", "arv") || "TBC",
    driverName: col(row, "drivername", "driver") || null,
    driverPhone: col(row, "driverphone", "phone") || null,
    plateNumber: col(row, "platenumber", "plate") || null,
  };
}

const MAX_ROWS = 500;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).end("Method Not Allowed");
    return;
  }

  try {
    const body = req.body as UploadBody;
    const text = body?.csv;

    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "No CSV data provided" });
      return;
    }

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      res.status(400).json({ error: "CSV must have a header row and data" });
      return;
    }

    const headers = parseCsvLine(lines[0]).map((h) =>
      h.toLowerCase().replace(/[^a-z0-9]/g, ""),
    );
    const dataLines = lines.slice(1, MAX_ROWS + 1);

    const existingTrips = getTrips();
    let updated = 0;
    let created = 0;

    for (const [i, line] of dataLines.entries()) {
      const values = parseCsvLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] ?? "";
      });

      const busId = col(row, "busidentifier", "bus", "id");
      const matchIdx = existingTrips.findIndex(
        (t) =>
          t.busIdentifier === busId &&
          t.conferenceDay === col(row, "conferenceday", "day") &&
          t.serviceName === col(row, "servicename", "service", "svc"),
      );

      if (matchIdx >= 0) {
        updateTrip(existingTrips[matchIdx].id, buildPatch(row));
        updated++;
      } else if (busId) {
        addTrip(buildNewTrip(row, i, existingTrips));
        created++;
      }
    }

    res.json({
      message: `Updated ${updated}, created ${created} trip${created === 1 ? "" : "s"}`,
      updated,
      created,
    });
  } catch (error) {
    console.error("POST /api/trips/upload error:", error);
    res.status(500).json({ error: "Failed to process CSV upload" });
  }
}
