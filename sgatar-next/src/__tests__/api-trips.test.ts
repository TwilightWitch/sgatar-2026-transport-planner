import { resetTrips } from "@/lib/tripStore";
import healthHandler from "@/pages/api/health";
import handler from "@/pages/api/trips/index";
import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it } from "vitest";

function makeReq(method = "GET", body?: unknown): NextApiRequest {
  return {
    method,
    body: body ?? {},
    query: {},
    headers: {},
    cookies: {},
  } as unknown as NextApiRequest;
}

function makeRes() {
  const r = {
    _status: 200,
    _data: null as unknown,
    status(c: number) {
      r._status = c;
      return r;
    },
    json(d: unknown) {
      r._data = d;
      return r;
    },
    end() {
      return r;
    },
    setHeader() {
      return r;
    },
  };
  return r as unknown as NextApiResponse & { _status: number; _data: unknown };
}

describe("GET /api/trips", () => {
  beforeEach(() => {
    resetTrips();
  });

  it("returns 200 with array of trips", async () => {
    const res = makeRes();
    await handler(makeReq(), res);
    const body = res._data as unknown[];
    expect(res._status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it("trips have expected fields", async () => {
    const res = makeRes();
    await handler(makeReq(), res);
    const body = res._data as Array<Record<string, unknown>>;
    const trip = body[0];
    expect(trip.id).toBeDefined();
    expect(trip.busIdentifier).toBeDefined();
    expect(trip.conferenceDay).toBeDefined();
    expect(trip.status).toBe("scheduled");
  });
});

describe("GET /api/health", () => {
  it("returns status ok", () => {
    const res = makeRes();
    healthHandler(makeReq(), res);
    const body = res._data as { status: string };
    expect(body.status).toBe("ok");
  });
});
