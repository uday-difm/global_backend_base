import { requireAuth } from "./requireAuth";
import prisma from "./prisma";
import { getSiteId } from "./siteGuard";
import { userHasSiteRole } from "./siteAuth";
import { ROLE_LEVEL } from "./rbac";

export async function getAuthUserOrDevBypass() {
  const user = await requireAuth();
  if (user) return user;

  if (process.env.NODE_ENV === "development") {
    const devUser = await prisma.user.findFirst();
    if (devUser) {
      return {
        ...devUser,
        globalRole: devUser.globalRole || "SUPERADMIN"
      };
    }
  }
  return null;
}

/**
 * Validate a raw gkey_* API key from the x-api-key header.
 * Returns { siteId } on success or null on failure.
 * API keys carry EDITOR-level trust by default.
 */
async function resolveApiKey(rawKey, siteId) {
  if (!rawKey) return null;

  const record = await prisma.apiKey.findFirst({
    where: {
      key: rawKey,
      siteId,
      isActive: true,
      deletedAt: null
    }
  });

  return record ? { siteId: record.siteId } : null;
}

export async function checkSitePermission(req, requiredRole) {
  let siteId;
  try {
    siteId = getSiteId(req);
  } catch (e) {
    return { error: "Missing site_id", status: 400 };
  }

  // --- IP block & rate limiting (shared for all auth paths) ---
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { securityService } = await import("@/services/security.service");
    const isBlocked = await securityService.isIpBlocked(siteId, ip);
    if (isBlocked) {
      return { error: "Access Denied: Your IP is blocked", status: 403 };
    }

    const controls = await securityService.getSecurityControls(siteId);
    const limitRps = controls.rateLimitRps || 60;
    const { checkRateLimit } = await import("@/lib/rateLimiter");
    const allowed = checkRateLimit(ip, limitRps);
    if (!allowed) {
      return { error: "Too Many Requests: Rate limit exceeded", status: 429 };
    }
  } catch (e) {
    console.error("IP checking / Rate limiting failed inside checkSitePermission:", e);
  }

  // --- Auth Path 1: API Key (x-api-key header) ---
  const rawApiKey = req.headers.get("x-api-key");
  if (rawApiKey) {
    const keyAuth = await resolveApiKey(rawApiKey, siteId);
    if (!keyAuth) {
      return { error: "Invalid or revoked API key", status: 401 };
    }

    // API keys carry EDITOR-level trust.
    // Reject if the route requires a higher role (e.g. ADMIN).
    const API_KEY_ROLE = "EDITOR";
    if (requiredRole && ROLE_LEVEL[requiredRole] > ROLE_LEVEL[API_KEY_ROLE]) {
      return { error: "Forbidden: API keys cannot access admin-only routes", status: 403 };
    }

    return { siteId, apiKeyAuth: true };
  }

  // --- Auth Path 2: Session (NextAuth cookie) ---
  const user = await getAuthUserOrDevBypass();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  if (requiredRole) {
    const hasAccess = await userHasSiteRole(user, siteId, requiredRole);
    if (!hasAccess) {
      return { error: "Forbidden: Insufficient permissions", status: 403 };
    }
  }

  return { user, siteId };
}

