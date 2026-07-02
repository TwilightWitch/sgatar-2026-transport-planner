import { getTrips, resetTrips } from "@/lib/tripStore";
import handler from "@/pages/api/trips/[id]";
import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it } from "vitest";

function makeReq(
  method: string,
  id: string,
  body?: Record<string, unknown>,
): NextApiRequest {
  return {
    method,
    body: body ?? {},
    query: { id },
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

describe("PATCH /api/trips/[id]", () => {
  beforeEach(() => {
    resetTrips();
  });

  it("updates currentPax", async () => {
    const id = getTrips()[0].id;
    const res = makeRes();
    await handler(makeReq("PATCH", id, { currentPax: 25 }), res);
    expect(res._status).toBe(200);
    expect((res._data as Record<string, unknown>).currentPax).toBe(25);
  });

  it("updates status", async () => {
    const id = getTrips()[0].id;
    const res = makeRes();
    await handler(makeReq("PATCH", id, { status: "boarding" }), res);
    expect((res._data as Record<string, unknown>).status).toBe("boarding");
  });

  it("updates isSos with sosMessage", async () => {
    const id = getTrips()[0].id;
    const res = makeRes();
    await handler(
      makeReq("PATCH", id, { isSos: true, sosMessage: "Bus breakdown" }),
      res,
    );
    const body = res._data as Record<string, unknown>;
    expect(body.isSos).toBe(true);
    expect(body.sosMessage).toBe("Bus breakdown");
  });

  it("rejects invalid currentPax", async () => {
    const id = getTrips()[0].id;
    const res = makeRes();
    await handler(makeReq("PATCH", id, { currentPax: -5 }), res);
    expect(res._status).toBe(400);
  });

  it("rejects invalid status", async () => {
    const id = getTrips()[0].id;
    const res = makeRes();
    await handler(makeReq("PATCH", id, { status: "flying" }), res);
    expect(res._status).toBe(400);
  });

  it("returns 404 for non-existent trip", async () => {
    const res = makeRes();
    await handler(makeReq("PATCH", "fake-id", { currentPax: 10 }), res);
    expect(res._status).toBe(404);
  });
});

describe("DELETE /api/trips/[id]", () => {
  beforeEach(() => {
    resetTrips();
  });

  it("deletes an existing trip", async () => {
    const id = getTrips()[0].id;
    const before = getTrips().length;
    const res = makeRes();
    await handler(makeReq("DELETE", id), res);
    expect(res._status).toBe(200);
    expect(getTrips().length).toBe(before - 1);
  });

  it("returns 404 for non-existent trip", async () => {
    const res = makeRes();
    await handler(makeReq("DELETE", "no-such-id"), res);
    expect(res._status).toBe(404);
  });
});
