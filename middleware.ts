import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/session";

/**
 * Everything is private except the lock screen and the Shortcuts endpoint,
 * which carries its own bearer token. Session checking happens here rather than
 * per page, so a new route is protected by default instead of by remembering.
 */
const PUBLIC = ["/lock", "/api/v1/log", "/sw.js", "/manifest.webmanifest"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  const userId = await readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (userId) return NextResponse.next();

  // Server actions POST to the page they came from; a redirect would be
  // swallowed, so answer with a status the client can actually act on.
  if (request.method === "POST") {
    return new NextResponse("Locked", { status: 401 });
  }

  return NextResponse.redirect(new URL("/lock", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon|apple-touch-icon|favicon).*)"],
};
