import { NextResponse } from "next/server";

/** Path prefixes that should never be blocked by maintenance mode */
const SKIP_PREFIXES = [
  "/api/",
  "/_next",
  "/dashboard",
  "/crm",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/maintenance",
  "/preview"
];

/** Static file extensions to skip checks for */
const STATIC_EXTENSIONS = [
  ".js",
  ".css",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".webp",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".json",
  ".txt",
  ".xml",
];

function shouldSkipMaintenanceCheck(pathname) {
  if (SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  if (STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    return true;
  }
  if (pathname === "/favicon.ico") return true;
  return false;
}

export async function proxy(request) {
  const origin = request.headers.get("origin") || "*";
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. Always inject x-pathname header so the layout and other components can read the current route path
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  // --------------- CORS handling (API routes only) ---------------
  if (pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") {
      const preflightHeaders = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, x-site-id, x-integration-key, x-requested-with, ngrok-skip-browser-warning",
        "Access-Control-Max-Age": "86400",
      };
      return new NextResponse(null, {
        status: 204,
        headers: preflightHeaders,
      });
    }

    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-site-id, x-integration-key, x-requested-with, ngrok-skip-browser-warning"
    );
    return response;
  }

  // Determine siteId from request, or fall back to environment variable configuration
  const siteId =
    request.headers.get("x-site-id") ||
    url.searchParams.get("siteId") ||
    process.env.SITE_ID ||
    process.env.NEXT_PUBLIC_SITE_ID ||
    "infinium";

  // --------------- Admin/CRM Auth Guard ---------------
  const ADMIN_PATHS = ["/dashboard", "/crm", "/preview"];
  const isDashboardPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  if (isDashboardPath) {
    const hasSession =
      request.cookies.has("next-auth.session-token") ||
      request.cookies.has("__Secure-next-auth.session-token");
    if (!hasSession) {
      const loginUrl = new URL("/login", url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // --------------- Maintenance Mode Check (public pages only) ---------------
  if (!shouldSkipMaintenanceCheck(pathname)) {
    try {
      const settingsRes = await fetch(
        `${url.origin}/api/settings?siteId=${encodeURIComponent(siteId)}`,
        { headers: { "x-internal-check": "1" } }
      );

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        const ws = settingsData?.data?.websiteSettings ?? settingsData?.websiteSettings;
        const isMaintenanceMode = ws?.maintenanceMode === true;

        if (isMaintenanceMode) {
          const maintenanceUrl = new URL("/maintenance", url);
          if (ws.maintenanceMessage) {
            maintenanceUrl.searchParams.set("message", ws.maintenanceMessage);
          }
          return NextResponse.redirect(maintenanceUrl);
        }
      }
    } catch (err) {
      console.error("Maintenance mode check error:", err.message);
    }
  }

  // --------------- Redirect Resolution ---------------
  if (
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/maintenance") &&
    !isDashboardPath &&
    process.env.NODE_ENV !== "development"
  ) {
    try {
      const redirectRes = await fetch(
        `${url.origin}/api/redirects?siteId=${encodeURIComponent(siteId)}&source=${encodeURIComponent(pathname)}`,
        { headers: { "x-internal-check": "1" } }
      );

      if (redirectRes.ok) {
        const redirectData = await redirectRes.json();
        const rule = redirectData?.data?.redirect ?? redirectData?.redirect;

        if (rule && rule.target && rule.target !== pathname) {
          const redirectUrl = new URL(rule.target, url);
          const status = rule.type === 302 ? 302 : 301;
          return NextResponse.redirect(redirectUrl, { status });
        }
      }
    } catch (err) {
      console.error("Redirect resolution error:", err.message);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // API routes (with CORS handling)
    "/api/:path*",
    // All page routes (for maintenance, redirects, auth guard)
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
