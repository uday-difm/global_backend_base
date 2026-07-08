import prisma from "@/lib/prisma";
/**
 * Resolves the active site for a given authenticated user.
 * Supporting cookie-based workspace selection switcher.
 *
 * @param {object} user - User object from requireAuth()
 * @returns {Promise<object|null>} Prisma Site record or null
 */
export async function getSiteForUser(user) {
  if (!user) return null;

  // Resolve directly from environment variables (single-site mode)
  const targetSiteId = process.env.NEXT_PUBLIC_SITE_ID || process.env.SITE_ID || "infinium";
  let site = await prisma.site.findUnique({
    where: { id: targetSiteId },
  });

  if (!site) {
    try {
      site = await prisma.site.create({
        data: {
          id: targetSiteId,
          name: targetSiteId === "AHP" ? "AHP Website" : `${targetSiteId.toUpperCase()} Website`,
          domain: `${targetSiteId.toLowerCase()}.local`,
          isActive: true,
        }
      });
    } catch (e) {
      console.error("Failed to automatically create site in database:", e);
    }
  }

  if (site) return site;

  // Catch-all fallback
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
