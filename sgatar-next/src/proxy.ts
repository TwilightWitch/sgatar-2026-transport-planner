/**
 * @file Next.js Proxy (formerly Middleware).
 *
 * Runs at the network edge before every matched request and enforces
 * authentication for the LO portal, Admin portal, and all `/api/trips/*`
 * mutation routes.
 *
 * Token format: base64url-encoded string `{portal}:{timestamp}:{nonce}:{sig}`
 * where `sig` is a 32-character prefix of the base64url-encoded HMAC-like
 * value `TOKEN_SECRET:{portal}:{timestamp}:{nonce}`.  Tokens expire after
 * 12 hours.
 *
 * In development, when neither `LO_PASSCODE` nor `ADMIN_PASSCODE` is set in
 * the environment, authentication is bypassed entirely so the app can be run
 * without credentials for testing.
 */
import { NextRequest, NextResponse } from "next/server";

const TOKEN_NAME = "sgatar_access_token";

const PROTECTED_PATHS = ["/lo", "/admin"];
/**
 * API sub-paths where mutations must be authenticated.
 * GET /api/trips is intentionally public — the delegate portal and display
 * board poll it without a session.  Only POST/PATCH/DELETE actions need a token.
 */
const PROTECTED_API_PATHS = ["/api/trips"];

/**
 * Verifies a session token created by `/api/auth`.
 * @param token - Raw cookie value (base64url-encoded payload).
 * @returns `{ portal }` if valid and unexpired, otherwise `null`.
 */
function verifyToken(token: string): { portal: string } | null {
  try {
    // Read at request time so Airbase's runtime env vars are available.
    const secret =
      process.env.ADMIN_PASSCODE ?? process.env.LO_PASSCODE ?? "dev-secret";

    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(":");
    if (parts.length < 4) return null;

    const [portal, timestamp, , signature] = parts;
    if (!portal || !timestamp || !signature) return null;

    // Verify HMAC signature
    const payload = parts.slice(0, 3).join(":");
    const expected = Buffer.from(secret + ":" + payload)
      .toString("base64url")
      .slice(0, 32);
    if (signature !== expected) return null;

    // Check token age (12 hours max)
    const tokenAge = Date.now() - Number.parseInt(timestamp, 10);
    if (tokenAge > 12 * 60 * 60 * 1000) return null;

    return { portal };
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPage = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  // GET requests to /api/trips are public (delegate portal + display board poll).
  // Only protect mutating methods (POST, PATCH, DELETE) on the trips API.
  const method = request.method.toUpperCase();
  const isReadOnlyApiRequest =
    method === "GET" || method === "HEAD" || method === "OPTIONS";
  const isProtectedApi =
    !isReadOnlyApiRequest &&
    PROTECTED_API_PATHS.some((path) => pathname.startsWith(path));

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  // Skip auth in dev when passcodes are not configured
  const hasPasscodes = process.env.LO_PASSCODE || process.env.ADMIN_PASSCODE;
  if (!hasPasscodes) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_NAME)?.value;

  // API routes: return 401 instead of redirect
  if (isProtectedApi && !isProtectedPage) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const verified = verifyToken(token);
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Page routes: redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const verified = verifyToken(token);
  if (!verified) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(TOKEN_NAME);
    return response;
  }

  // Verify portal access level
  const requiredPortal = pathname.startsWith("/admin") ? "admin" : "lo";
  if (requiredPortal === "admin" && verified.portal !== "admin") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    loginUrl.searchParams.set("error", "insufficient_access");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/lo/:path*", "/admin/:path*", "/api/trips/:path*"],
};
