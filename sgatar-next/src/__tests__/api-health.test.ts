import handler from "@/pages/api/health";
import type { NextApiRequest, NextApiResponse } from "next";
import { describe, expect, it } from "vitest";

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
  return r as unknown as NextApiResponse & {
    _status: number;
    _data: unknown;
  };
}

describe("GET /api/health", () => {
  it("returns 200 with correct shape", () => {
    const res = makeRes();
    handler({} as unknown as NextApiRequest, res);
    expect(res._status).toBe(200);
  });

  it("body has status, timestamp, uptime", () => {
    const res = makeRes();
    handler({} as unknown as NextApiRequest, res);
    const body = res._data as {
      status: string;
      timestamp: string;
      uptime: number;
    };
    expect(body.status).toBe("ok");
    expect(typeof body.timestamp).toBe("string");
    expect(typeof body.uptime).toBe("number");
  });
});
