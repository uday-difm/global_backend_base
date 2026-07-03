export function getSiteId(req) {
  // If a request object is provided, check the x-site-id header first.
  // This allows dashboard client pages to specify the active site via header.
  if (req && typeof req.headers?.get === "function") {
    const headerSiteId = req.headers.get("x-site-id");
    if (headerSiteId && headerSiteId !== "demo") {
      return headerSiteId;
    }
  }
  // Fallback to environment variable (for SDK/external API calls)
  return process.env.NEXT_PUBLIC_SITE_ID || process.env.SITE_ID || "infinium";
}
