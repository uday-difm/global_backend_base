import { prisma } from "@/lib/prisma";

export async function logAction(siteId, userId, action, meta = {}) {
  return await prisma.auditLog.create({
    data: { siteId, userId, action, meta },
  });
}

export async function recordLogin(userId, ipAddress, userAgent, success = true) {
  return await prisma.loginHistory.create({
    data: { userId, ipAddress, userAgent, success },
  });
}
