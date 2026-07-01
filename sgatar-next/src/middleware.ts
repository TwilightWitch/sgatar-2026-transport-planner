import { NextRequest, NextResponse } from "next/server";

const TOKEN_NAME = "sgatar_access_token";

const PROTECTED_PATHS = ["/lo", "/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Skip auth in dev when passcodes are not configured
  const hasPasscodes = process.env.LO_PASSCODE || process.env.ADMIN_PASSCODE;
  if (!hasPasscodes) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Decode and validate token structure
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const [portal, timestamp] = decoded.split(":");

    if (!portal || !timestamp) {
      throw new Error("Invalid token structure");
    }

    // Check token age (12 hours max)
    const tokenAge = Date.now() - Number.parseInt(timestamp, 10);
    if (tokenAge > 12 * 60 * 60 * 1000) {
      throw new Error("Token expired");
    }

    // Verify portal access level
    const requiredPortal = pathname.startsWith("/admin") ? "admin" : "lo";

    // Admin token can access both; LO token can only access /lo
    if (requiredPortal === "admin" && portal !== "admin") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("error", "insufficient_access");
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch {
    // Invalid token — redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(TOKEN_NAME);
    return response;
  }
}

export const config = {
  matcher: ["/lo/:path*", "/admin/:path*"],
};
