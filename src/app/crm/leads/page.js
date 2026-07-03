import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { getSiteForUser } from "@/lib/getSiteForUser";
import { redirect } from "next/navigation";
import LeadsManager from "./LeadsManager";

export const metadata = {
  title: "Leads & Contact Forms | Marketing CRM",
  description: "Manage contact form submissions, leads pipeline, email settings and spam protection",
};

export default async function LeadsPage() {
  const user = await requireAuth();
  if (!user) return null;
  if (user.globalRole === "VIEWER") redirect("/admin/dashboard");

  const site = await getSiteForUser(user);

  if (!site) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Leads & Contact Forms</h1>
        <p className="mt-4 text-sm text-red-600">No active site found. Please configure a site first.</p>
      </div>
    );
  }

  const [submissions, leads, settings] = await Promise.all([
    prisma.contactFormSubmission.findMany({
      where: { siteId: site.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lead.findMany({
      where: { siteId: site.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
    }),
    prisma.globalSettings.findUnique({
      where: { siteId: site.id },
      select: { emailSettings: true, securityControls: true },
    }),
  ]);

  // Sanitize email settings: never expose password to client
  const emailSettings = settings?.emailSettings
    ? { ...settings.emailSettings, password: settings.emailSettings.password ? "********" : "" }
    : {};

  const initialConfig = {
    emailSettings,
    spamConfig: settings?.securityControls || {},
  };

  return (
    <LeadsManager
      siteId={site.id}
      initialSubmissions={JSON.parse(JSON.stringify(submissions))}
      initialLeads={JSON.parse(JSON.stringify(leads))}
      initialConfig={initialConfig}
    />
  );
}
