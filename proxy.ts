import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/session";

/**
 * Everything is private except the two sign-in screens and the Shortcuts
 * endpoint, which carries its own bearer token. Checking here rather than per
 * page means a new route is protected by default instead of by remembering.
 *
 * Three states, in order: no session goes to sign-in, a locked session goes to
 * the PIN pad, an open session goes wherever it was headed.
 */
const PUBLIC = ["/signin", "/signup", "/api/v1/log", "/sw.js", "/manifest.webmanifest"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  const session = await readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const atPinPad = pathname === "/lock";

  if (session?.unlocked) {
    // Nothing to unlock. Only on GET: a redirect would swallow the action that
    // POSTs back to the pad in the moment it becomes open.
    if (atPinPad && request.method === "GET") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (session && atPinPad) return NextResponse.next();

  // Server actions POST to the page they came from; a redirect would be
  // swallowed, so answer with a status the client can actually act on.
  if (request.method === "POST") {
    return new NextResponse("Locked", { status: 401 });
  }

  return NextResponse.redirect(new URL(session ? "/lock" : "/signin", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icons|favicon).*)"],
};
