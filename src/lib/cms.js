import { CMSClient } from "@yourcompany/global-backend-next";

// Abort fetch after this many ms when the backend is unreachable
const FETCH_TIMEOUT = 15_000;

const _origRequest = CMSClient.prototype._request;
CMSClient.prototype._request = function (...args) {
  // Race the original SDK request against a timeout so the frontend never
  // hangs for minutes when the backend is unreachable.
  return Promise.race([
    _origRequest.apply(this, args),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("CMS request timed out")),
        FETCH_TIMEOUT,
      ),
    ),
  ]);
};
CMSClient.prototype.getPosts = function (options = {}) {
  const params = new URLSearchParams();
  if (options.page) params.set("page", options.page);
  if (options.limit) params.set("limit", options.limit);
  if (options.search) params.set("search", options.search);
  const qs = params.toString();
  return this._request(`/api/posts${qs ? "?" + qs : ""}`);
};

export const cms = new CMSClient({
  baseUrl: process.env.NEXT_PUBLIC_CMS_BASE_URL ||
    (typeof window === "undefined"
      ? "http://localhost:3000"
      : window.location.origin),
  siteId: process.env.NEXT_PUBLIC_SITE_ID || "infinium",
});
