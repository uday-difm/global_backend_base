import { NextResponse } from "next/server";

/**
 * Unified proxy for App Router integration.
 *
 * Responsibilities:
 *  1. Inject x-pathname header so the root layout can detect admin vs public paths
 *  2. CORS headers on all /api/* routes
 *  3. Auth guard: redirect unauthenticated users away from /admin and /crm
 */

const ADMIN_PATHS = ["/admin", "/crm", "/preview"];

export default async function proxy(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  console.log(`[Proxy] request: ${request.method} ${pathname}`);

  // 1. Always inject x-pathname so the root layout knows which shell to render
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // 2. CORS on API routes
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin") || "*";
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, x-site-id, x-integration-key, x-requested-with, ngrok-skip-browser-warning",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-site-id, x-integration-key, x-requested-with, ngrok-skip-browser-warning");
    return response;
  }

  // 3. Admin/CRM auth guard
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  if (isAdminPath) {
    const hasSession =
      request.cookies.has("next-auth.session-token") ||
      request.cookies.has("__Secure-next-auth.session-token");
    if (!hasSession) {
      const loginUrl = new URL("/login", url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
