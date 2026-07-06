import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";
import os from "os";
import { apiSuccess } from "@/core/errors";

export async function GET(req) {
  const auth = await checkSitePermission(req, "ADMIN");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const start = Date.now();
  let dbStatus = "Offline";
  let dbPingTime = null;

  try {
    // Ping database
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "Connected";
    dbPingTime = `${Date.now() - start}ms`;
  } catch (err) {
    console.error("DB Ping Error:", err);
  }

  // Check Cloudinary configs
  const cloudinaryStatus = (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) ? "Configured" : "Not Configured";

  // Check Env configurations
  const nextAuthUrl = process.env.NEXTAUTH_URL || "Not set";

  // System Diagnostics
  let memoryUsagePercent = 0;
  let freeMemory = 0;
  let totalMemory = 0;
  let systemUptime = 0;

  try {
    totalMemory = os.totalmem();
    freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    memoryUsagePercent = totalMemory > 0 ? parseFloat(((usedMemory / totalMemory) * 100).toFixed(1)) : 0;
    systemUptime = os.uptime();
  } catch (osErr) {
    console.error("OS resource checks failed:", osErr);
  }

  // Database Telemetry
  let recordCounts = {};
  try {
    const siteId = auth.siteId;
    const [pagesCount, postsCount, mediaCount, visitorLogsCount, errorLogsCount] = await Promise.all([
      prisma.page.count({ where: { siteId, deletedAt: null } }),
      prisma.post.count({ where: { siteId, deletedAt: null } }),
      prisma.media.count({ where: { siteId, deletedAt: null } }),
      prisma.visitorLog.count({ where: { siteId } }),
      prisma.systemErrorLog.count({ where: { siteId } }),
    ]);

    recordCounts = {
      pages: pagesCount,
      posts: postsCount,
      mediaAssets: mediaCount,
      visitorHistory: visitorLogsCount,
      systemErrors: errorLogsCount,
    };
  } catch (dbCountErr) {
    console.error("DB count queries failed inside site-health:", dbCountErr);
  }

  return NextResponse.json(apiSuccess({ status: dbStatus === "Connected" ? "healthy" : "degraded",
    checks: {
      database: {
        status: dbStatus,
        latency: dbPingTime,
        counts: recordCounts,
      },
      cloudinary: {
        status: cloudinaryStatus,
      },
      environment: {
        nextAuthUrl,
        nodeEnv: process.env.NODE_ENV,
      },
      system: {
        memoryUsedPercent: memoryUsagePercent,
        totalMemoryBytes: totalMemory,
        freeMemoryBytes: freeMemory,
        uptimeSeconds: systemUptime,
      },
    },
    responseTime: `${Date.now() - start}ms` }));
}
