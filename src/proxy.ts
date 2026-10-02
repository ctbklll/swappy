import { NextResponse, type NextRequest } from "next/server";

// Cheap gate based on the session cookie's presence.
// Real verification (HMAC signature) happens in route handlers via currentUser().
export function proxy(req: NextRequest) {
  const has = req.cookies.has("swappy_session");
  const { pathname } = req.nextUrl;
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (pathname === "/welcome" || pathname === "/download") return NextResponse.next();
  // Visitors see the landing page at "/" (URL stays "/"); signed-in users get the dashboard.
  if (pathname === "/" && !has) return NextResponse.rewrite(new URL("/welcome", req.url));
  if (!has && !isAuthPage) return NextResponse.redirect(new URL("/login", req.url));
  if (has && isAuthPage) return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|downloads/|icon.png|apple-icon.png|logo.png).*)"],
};
