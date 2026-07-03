import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

/**
 * Resolves the active site for a given authenticated user.
 * Supporting cookie-based workspace selection switcher.
 *
 * @param {object} user - User object from requireAuth()
 * @returns {Promise<object|null>} Prisma Site record or null
 */
export async function getSiteForUser(user) {
  if (!user) return null;

  // 1. Try to read active site from cookies (set by site switcher component)
  let activeSiteId;
  try {
    const cookieStore = await cookies();
    activeSiteId = cookieStore.get("active_site_id")?.value;
  } catch (e) {
    // cookies() can throw when called in certain static build contexts
  }

  if (activeSiteId) {
    const site = await prisma.site.findUnique({
      where: { id: activeSiteId },
    });
    if (site) return site;
  }

  // 2. Fall back to environment site ID (defaults to infinium)
  const fallbackSiteId = process.env.NEXT_PUBLIC_SITE_ID || process.env.SITE_ID || "infinium";
  const site = await prisma.site.findUnique({
    where: { id: fallbackSiteId },
  });
  if (site) return site;

  // 3. Catch-all fallback
  return prisma.site.findFirst({
    where: { isActive: true, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Convenience wrapper that returns just the siteId string.
 */
export async function getSiteIdForUser(user) {
  const site = await getSiteForUser(user);
  return site?.id || null;
}
