import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { getSiteForUser } from "@/lib/getSiteForUser";
import CrmDashboardClient from "./CrmDashboardClient";

export default async function CrmDashboardPage() {
  const user = await requireAuth();
  const site = await getSiteForUser(user);

  if (!site) {
    return (
      <div className="p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Marketing CRM</h1>
        <div className="p-4 bg-yellow-50 text-yellow-800 border border-yellow-250 rounded-xl text-sm max-w-md mx-auto">
          No active site configuration found. Please configure a site in the database first.
        </div>
      </div>
    );
  }

  // Pre-load default range = 30 days
  const range = 30;
  const dateLimit = new Date(Date.now() - range * 24 * 60 * 60 * 1000);

  const [
    crmSubscribers,
    totalLists,
    totalCampaigns,
    totalPushes,
    crmLeads,
    totalPageViews,
    recentSubscribers,
    recentCampaigns,
  ] = await Promise.all([
    // 1. Total active subscribers
    prisma.subscriber.count({ where: { siteId: site.id } }),
    // 2. Total lists
    prisma.subscriberList.count({ where: { siteId: site.id } }),
    // 3. Total campaigns
    prisma.emailCampaign.count({ where: { siteId: site.id } }),
    // 4. Total push alerts
    prisma.pushNotification.count({ where: { siteId: site.id } }),
    // 5. Total leads in range
    prisma.lead.count({ where: { siteId: site.id, createdAt: { gte: dateLimit } } }),
    // 6. Total pageviews in range
    prisma.visitorLog.count({ where: { siteId: site.id, createdAt: { gte: dateLimit } } }),
    // 7. Recent 5 subscribers
    prisma.subscriber.findMany({
      where: { siteId: site.id },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    // 8. Recent 5 campaigns
    prisma.emailCampaign.findMany({
      where: { siteId: site.id },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Pre-calculate traffic trends (daily page views)
  const logs = await prisma.visitorLog.findMany({
    where: { siteId: site.id, createdAt: { gte: dateLimit } },
    select: { createdAt: true, visitorId: true },
    orderBy: { createdAt: "asc" },
  });

  const trafficTrends = {};
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dayStr = d.toISOString().split("T")[0];
    trafficTrends[dayStr] = { date: dayStr, pageViews: 0, uniqueVisitors: new Set() };
  }

  logs.forEach((log) => {
    const dayStr = log.createdAt.toISOString().split("T")[0];
    if (trafficTrends[dayStr]) {
      trafficTrends[dayStr].pageViews++;
      trafficTrends[dayStr].uniqueVisitors.add(log.visitorId);
    }
  });

  const trendsList = Object.values(trafficTrends).map((t) => ({
    date: t.date,
    pageViews: t.pageViews,
    uniqueVisitors: t.uniqueVisitors.size,
  }));

  // Campaign performance metrics
  const emailCampaigns = await prisma.emailCampaign.findMany({
    where: { siteId: site.id, createdAt: { gte: dateLimit } },
    include: { logs: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const campaignsPerf = emailCampaigns.map((c) => {
    const totalSent = c.logs.filter((l) => l.status === "sent").length;
    const totalOpened = c.logs.filter((l) => l.status === "opened").length;
    const totalClicked = c.logs.filter((l) => l.status === "clicked").length;

    return {
      id: c.id,
      name: c.name,
      subject: c.subject,
      status: c.status,
      sentCount: totalSent,
      openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
      clickRate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0,
    };
  });

  // Revenue pipeline stats
  const services = await prisma.service.findMany({
    where: { siteId: site.id, deletedAt: null },
    select: { title: true, price: true },
  });

  const priceMap = {};
  services.forEach((s) => {
    const priceNum = parseFloat(String(s.price || "").replace(/[^0-9.]/g, ""));
    priceMap[s.title.toLowerCase()] = isNaN(priceNum) ? 500 : priceNum;
  });

  const leads = await prisma.lead.findMany({
    where: { siteId: site.id, createdAt: { gte: dateLimit } },
    select: { status: true, serviceInterest: true },
  });

  let totalPipelineValue = 0;
  let wonLeads = 0;

  leads.forEach((l) => {
    const interest = l.serviceInterest ? l.serviceInterest.toLowerCase() : "";
    const val = priceMap[interest] || 500;
    totalPipelineValue += val;
    if (l.status === "won" || l.status === "converted" || l.status === "approved") {
      wonLeads++;
    }
  });

  const statsPayload = {
    crmSubscribers,
    totalLists,
    totalCampaigns,
    totalPushes,
    crmLeads,
    totalPageViews,
    totalPipelineValue,
    conversionRate: leads.length > 0 ? Math.round((wonLeads / leads.length) * 100) : 0,
  };

  return (
    <CrmDashboardClient
      siteId={site.id}
      siteName={site.name}
      initialStats={statsPayload}
      initialTrends={trendsList}
      initialCampaignPerformance={campaignsPerf}
      recentSubscribers={JSON.parse(JSON.stringify(recentSubscribers))}
      recentCampaigns={JSON.parse(JSON.stringify(recentCampaigns))}
    />
  );
}
