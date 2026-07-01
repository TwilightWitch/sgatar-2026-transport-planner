import { DELETE, PATCH } from "@/app/api/trips/[id]/route";
import { getTrips, resetTrips } from "@/lib/tripStore";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/trips/x", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/trips/[id]", () => {
  beforeEach(() => {
    resetTrips();
  });

  it("updates currentPax", async () => {
    const id = getTrips()[0].id;
    const req = makeRequest({ currentPax: 25 });
    const res = await PATCH(req, { params: Promise.resolve({ id }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.currentPax).toBe(25);
  });

  it("updates status", async () => {
    const id = getTrips()[0].id;
    const req = makeRequest({ status: "boarding" });
    const res = await PATCH(req, { params: Promise.resolve({ id }) });
    const body = await res.json();
    expect(body.status).toBe("boarding");
  });

  it("updates isSos with sosMessage", async () => {
    const id = getTrips()[0].id;
    const req = makeRequest({ isSos: true, sosMessage: "Bus breakdown" });
    const res = await PATCH(req, { params: Promise.resolve({ id }) });
    const body = await res.json();
    expect(body.isSos).toBe(true);
    expect(body.sosMessage).toBe("Bus breakdown");
  });

  it("rejects invalid currentPax", async () => {
    const id = getTrips()[0].id;
    const req = makeRequest({ currentPax: -5 });
    const res = await PATCH(req, { params: Promise.resolve({ id }) });
    expect(res.status).toBe(400);
  });

  it("rejects invalid status", async () => {
    const id = getTrips()[0].id;
    const req = makeRequest({ status: "flying" });
    const res = await PATCH(req, { params: Promise.resolve({ id }) });
    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent trip", async () => {
    const req = makeRequest({ currentPax: 10 });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "fake-id" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/trips/[id]", () => {
  beforeEach(() => {
    resetTrips();
  });

  it("deletes an existing trip", async () => {
    const id = getTrips()[0].id;
    const before = getTrips().length;
    const req = new NextRequest("http://localhost/api/trips/" + id, {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ id }) });
    expect(res.status).toBe(200);
    expect(getTrips().length).toBe(before - 1);
  });

  it("returns 404 for non-existent trip", async () => {
    const req = new NextRequest("http://localhost/api/trips/nope", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: "nope" }) });
    expect(res.status).toBe(404);
  });
});
