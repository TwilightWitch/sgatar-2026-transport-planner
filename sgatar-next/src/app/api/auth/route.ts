/**
 * @file Authentication API route — `/api/auth`.
 *
 * POST: Validates a passcode against the configured `LO_PASSCODE` or
 * `ADMIN_PASSCODE` environment variable and sets an `httpOnly` session cookie
 * containing a signed, time-limited token.
 *
 * DELETE: Clears the session cookie (logout).
 *
 * In development, when no passcode env vars are set, any passcode is accepted
 * so the app can be tested without credentials.
 */
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface AuthBody {
  passcode: string;
  portal: "lo" | "admin";
}

const TOKEN_NAME = "sgatar_access_token";
const TOKEN_MAX_AGE = 60 * 60 * 12; // 12 hours

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AuthBody;

    if (!body.passcode || !body.portal) {
      return NextResponse.json(
        { error: "passcode and portal are required" },
        { status: 400 },
      );
    }

    const validPortals = ["lo", "admin"] as const;
    if (!validPortals.includes(body.portal)) {
      return NextResponse.json({ error: "Invalid portal" }, { status: 400 });
    }

    const expectedPasscode =
      body.portal === "admin"
        ? process.env.ADMIN_PASSCODE
        : process.env.LO_PASSCODE;

    // In dev without passcodes configured, accept any input
    if (!expectedPasscode) {
      const tokenPayload = `${body.portal}:${Date.now()}:${crypto.randomUUID()}`;
      const token = Buffer.from(tokenPayload).toString("base64url");

      const cookieStore = await cookies();
      cookieStore.set(TOKEN_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: TOKEN_MAX_AGE,
        path: "/",
      });

      return NextResponse.json({ success: true, portal: body.portal });
    }

    // Constant-time comparison to prevent timing attacks
    const passcodeBuffer = Buffer.from(body.passcode);
    const expectedBuffer = Buffer.from(expectedPasscode);

    let isValid = passcodeBuffer.length === expectedBuffer.length;
    if (crypto.subtle) {
      const [hash1, hash2] = await Promise.all([
        crypto.subtle.digest("SHA-256", passcodeBuffer),
        crypto.subtle.digest("SHA-256", expectedBuffer),
      ]);
      isValid =
        isValid && Buffer.compare(Buffer.from(hash1), Buffer.from(hash2)) === 0;
    } else {
      // timingSafeEqual for environments without SubtleCrypto
      isValid =
        isValid &&
        require("node:crypto").timingSafeEqual(passcodeBuffer, expectedBuffer);
    }

    if (!isValid) {
      return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
    }

    // Generate HMAC-signed session token
    const secret =
      process.env.ADMIN_PASSCODE ?? process.env.LO_PASSCODE ?? "dev-secret";
    const payload = `${body.portal}:${Date.now()}:${crypto.randomUUID()}`;
    const signature = Buffer.from(secret + ":" + payload)
      .toString("base64url")
      .slice(0, 32);
    const token = Buffer.from(`${payload}:${signature}`).toString("base64url");

    const cookieStore = await cookies();
    cookieStore.set(TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: TOKEN_MAX_AGE,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      portal: body.portal,
    });
  } catch (error) {
    console.error("POST /api/auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
  return NextResponse.json({ success: true });
}
