import { getTrips, resetTrips } from "@/lib/tripStore";
import handler from "@/pages/api/trips/adhoc";
import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it } from "vitest";

function makeReq(body: Record<string, unknown>): NextApiRequest {
  return {
    method: "POST",
    body,
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

describe("POST /api/trips/adhoc", () => {
  beforeEach(() => {
    resetTrips();
  });

  it("creates an ad-hoc trip", async () => {
    const before = getTrips().length;
    const res = makeRes();
    await handler(
      makeReq({
        routeId: "test-route",
        busIdentifier: "GHOST-01",
        maxCapacity: 45,
        operationalNote: "Extra bus",
      }),
      res,
    );
    expect(res._status).toBe(201);
    const body = res._data as Record<string, unknown>;
    expect(body.busIdentifier).toBe("GHOST-01");
    expect(body.isAdhoc).toBe(true);
    expect(body.maxCapacity).toBe(45);
    expect(getTrips().length).toBe(before + 1);
  });

  it("defaults capacity to 40", async () => {
    const res = makeRes();
    await handler(makeReq({ routeId: "r", busIdentifier: "B1" }), res);
    expect((res._data as Record<string, unknown>).maxCapacity).toBe(40);
  });

  it("rejects missing routeId", async () => {
    const res = makeRes();
    await handler(makeReq({ busIdentifier: "B1" }), res);
    expect(res._status).toBe(400);
  });

  it("rejects missing busIdentifier", async () => {
    const res = makeRes();
    await handler(makeReq({ routeId: "r" }), res);
    expect(res._status).toBe(400);
  });

  it("rejects capacity > 100", async () => {
    const res = makeRes();
    await handler(
      makeReq({ routeId: "r", busIdentifier: "B1", maxCapacity: 150 }),
      res,
    );
    expect(res._status).toBe(400);
  });

  it("rejects capacity < 1", async () => {
    const res = makeRes();
    await handler(
      makeReq({ routeId: "r", busIdentifier: "B1", maxCapacity: 0 }),
      res,
    );
    expect(res._status).toBe(400);
  });
});

it("returns 405 for non-POST", async () => {
  const res = makeRes();
  await handler(
    {
      method: "GET",
      body: {},
      query: {},
      headers: {},
      cookies: {},
    } as NextApiRequest,
    res,
  );
  expect(res._status).toBe(405);
});
