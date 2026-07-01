import { GET as healthGET } from "@/app/api/health/route";
import { describe, expect, it } from "vitest";

describe("GET /api/health", () => {
  it("returns 200 with correct shape", () => {
    const res = healthGET();
    expect(res.status).toBe(200);
  });

  it("body has status, timestamp, uptime", async () => {
    const res = healthGET();
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(typeof body.timestamp).toBe("string");
    expect(typeof body.uptime).toBe("number");
  });
});
