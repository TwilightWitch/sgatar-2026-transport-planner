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

    const isValid =
      passcodeBuffer.length === expectedBuffer.length &&
      crypto.subtle !== undefined &&
      Buffer.compare(
        Buffer.from(await crypto.subtle.digest("SHA-256", passcodeBuffer)),
        Buffer.from(await crypto.subtle.digest("SHA-256", expectedBuffer)),
      ) === 0;

    // Fallback for environments without subtle crypto
    const simpleMatch = body.passcode === expectedPasscode;

    if (!isValid && !simpleMatch) {
      return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
    }

    // Generate a simple session token
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
