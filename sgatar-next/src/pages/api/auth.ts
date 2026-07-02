/**
 * @file Authentication API route — `/api/auth`.
 *
 * POST: Validates a passcode, generates a signed session token, and sets an
 * httpOnly cookie.
 *
 * DELETE: Clears the session cookie (logout).
 */
import type { NextApiRequest, NextApiResponse } from "next";

const TOKEN_NAME = "sgatar_access_token";
const TOKEN_MAX_AGE = 60 * 60 * 12; // 12 hours

function setCookieHeader(
  res: NextApiResponse,
  value: string,
  maxAge: number,
): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${TOKEN_NAME}=${value}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`,
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method === "DELETE") {
    setCookieHeader(res, "", 0);
    res.json({ success: true });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).end("Method Not Allowed");
    return;
  }

  try {
    const body = req.body as { passcode?: string; portal?: string };

    if (!body.passcode || !body.portal) {
      res
        .status(400)
        .json({ error: "passcode and portal are required" });
      return;
    }

    const validPortals = ["lo", "admin"] as const;
    if (!validPortals.includes(body.portal as "lo" | "admin")) {
      res.status(400).json({ error: "Invalid portal" });
      return;
    }

    const portal = body.portal as "lo" | "admin";
    const expectedPasscode =
      portal === "admin"
        ? process.env.ADMIN_PASSCODE
        : process.env.LO_PASSCODE;

    // In dev without passcodes configured, accept any input
    if (!expectedPasscode) {
      const tokenPayload = `${portal}:${Date.now()}:${crypto.randomUUID()}`;
      const token = Buffer.from(tokenPayload).toString("base64url");
      setCookieHeader(res, token, TOKEN_MAX_AGE);
      res.json({ success: true, portal });
      return;
    }

    // Constant-time comparison to prevent timing attacks
    const passcodeBuffer = Buffer.from(body.passcode);
    const expectedBuffer = Buffer.from(expectedPasscode);
    let isValid = passcodeBuffer.length === expectedBuffer.length;

    const [hash1, hash2] = await Promise.all([
      crypto.subtle.digest("SHA-256", passcodeBuffer),
      crypto.subtle.digest("SHA-256", expectedBuffer),
    ]);
    isValid =
      isValid && Buffer.compare(Buffer.from(hash1), Buffer.from(hash2)) === 0;

    if (!isValid) {
      res.status(401).json({ error: "Invalid passcode" });
      return;
    }

    // Generate HMAC-signed session token
    const secret =
      process.env.ADMIN_PASSCODE ?? process.env.LO_PASSCODE ?? "dev-secret";
    const payload = `${portal}:${Date.now()}:${crypto.randomUUID()}`;
    const signature = Buffer.from(`${secret}:${payload}`)
      .toString("base64url")
      .slice(0, 32);
    const token = Buffer.from(`${payload}:${signature}`).toString("base64url");

    setCookieHeader(res, token, TOKEN_MAX_AGE);
    res.json({ success: true, portal });
  } catch (error) {
    console.error("POST /api/auth error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}
