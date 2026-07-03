import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { getSiteForUser } from "@/lib/getSiteForUser";
import StatCard from "@/components/dashboard/StatCard";
import CreateFirstSiteForm from "@/components/dashboard/CreateFirstSiteForm";
import {
  Inbox,
  FileText,
  Newspaper,
  Quote,
  AlertCircle,
  Play,
  UserPlus,
  Database,
  ShieldCheck,
  PanelTop,
  Bell,
  PlusCircle,
  Briefcase,
  Layers,
  HelpCircle,
  FolderOpen,
  BarChart2,
  Activity,
} from "lucide-react";

const allActions = [
  {
    label: "Database Backup",
    desc: "Run database/media backups",
    href: "/admin/backup",
    icon: Database,
    roles: ["SUPERADMIN", "ADMIN"],
  },
  {
    label: "Security Console",
    desc: "View audit logs & access history",
    href: "/admin/security",
    icon: ShieldCheck,
    roles: ["SUPERADMIN", "ADMIN"],
  },
  {
    label: "Leads CRM",
    desc: "Manage customer form inquiries",
    href: "/crm/leads",
    icon: Inbox,
    roles: ["EDITOR"],
  },
  {
    label: "Manage Menus",
    desc: "Modify navigation structures",
    href: "/admin/navigation",
    icon: Layers,
    roles: ["EDITOR"],
  },
  {
    label: "New Blog Post",
    desc: "Compose a new draft article",
    href: "/admin/blogs/new",
    icon: Newspaper,
    roles: ["AUTHOR"],
  },
  {
    label: "Upload Media",
    desc: "Manage images and assets",
    href: "/admin/media",
    icon: FolderOpen,
    roles: ["AUTHOR"],
  },
  {
    label: "System Status",
    desc: "Monitor platform performance",
    href: "/admin/performance",
    icon: Activity,
    roles: ["VIEWER"],
  },
  {
    label: "Manage Pages",
    desc: "Edit layouts & build pages",
    href: "/admin/pages",
    icon: PlusCircle,
    roles: ["SUPERADMIN", "ADMIN", "EDITOR"],
  },
  {
    label: "Edit Blogs",
    desc: "Update resources & articles",
    href: "/admin/blogs",
    icon: FileText,
    roles: ["SUPERADMIN", "ADMIN", "EDITOR", "AUTHOR"],
  },
];

export default async function DashboardPage() {
  // Fetch active site context
  const user = await requireAuth();
  const site = await getSiteForUser(user);

  if (!site) {
    return (
      <div className="p-6 space-y-6 w-full max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 text-center">Dashboard</h1>
        <div className="p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-xl text-sm text-center">
          No active site configuration found. Please create your first site workspace below.
        </div>
        <CreateFirstSiteForm />
      </div>
    );
  }

  // Fetch site-scoped stats
  const totalPages = await prisma.page.count({
    where: { siteId: site.id, deletedAt: null },
  });

  const totalPosts = await prisma.post.count({
    where: { siteId: site.id, deletedAt: null },
  });
  const totalLeads = await prisma.lead.count({
    where: { siteId: site.id, status: { in: ["new", "contacted"] } },
  });
  const totalTestimonials = await prisma.testimonial.count({
    where: { siteId: site.id, showHide: true },
  });

  // Fetch recent items
  const recentLeads = await prisma.lead.findMany({
    where: { siteId: site.id },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  const recentSubmissions = await prisma.contactFormSubmission.findMany({
    where: { siteId: site.id },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  const globalRole = user.globalRole || "VIEWER";
  const filteredActions = allActions.filter((action) =>
    action.roles.includes(globalRole)
  );

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold md:text-3xl ">
          Dashboard
        </h1>
        <p className="text-gray-500 text-sm mt-0.5 flex flex-wrap items-center gap-1.5">
          Overview for:{" "}
          <span className="font-semibold text-gray-800">{site.name}</span>{" "}
          {site.domain ? `(${site.domain})` : ""} | Site ID:{" "}
          <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-indigo-650 dark:text-indigo-400 select-all font-semibold">
            {site.id}
          </span>
        </p>
      </div>

      {/* Quick Actions Block */}
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-800/40 dark:to-indigo-950/10 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Quick Actions
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Available tools and controls based on your <span className="font-semibold text-slate-650 dark:text-slate-400">{globalRole}</span> role
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 w-fit">
            {globalRole}
          </span>
        </div>
        
        {filteredActions.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No actions available for your role.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <Link
                  key={idx}
                  href={action.href}
                  className="group flex flex-col justify-between p-3.5 bg-white dark:bg-slate-800/90 border border-slate-100 dark:border-slate-700/60 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="space-y-3">
                    <div className="inline-flex p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors">
                      <Icon size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {action.label}
                      </h3>
                      <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-1 leading-normal line-clamp-2">
                        {action.desc}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active Pages" value={totalPages} />
        <StatCard title="Blog Posts" value={totalPosts} />
        <StatCard title="Open CRM Leads" value={totalLeads} />
        <StatCard title="Testimonials (Visible)" value={totalTestimonials} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Recent Leads */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2">
              Recent CRM Leads
            </h2>
            <div className="space-y-3">
              {recentLeads.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  No leads registered yet.
                </p>
              ) : (
                recentLeads.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-2 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-slate-200">
                        {item.name}
                      </span>
                      <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-0.5">
                        {item.serviceInterest || "General inquiry"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${item.status === "new"
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/40"
                          : "bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 border-yellow-250 dark:border-yellow-900/40"
                        }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <Link
              href="/leads"
              className="text-xs text-blue-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
            >
              View Leads CRM <Play size={10} fill="currentColor" />
            </Link>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2">
              Recent Inquiries
            </h2>
            <div className="space-y-3">
              {recentSubmissions.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  No inquiries received yet.
                </p>
              ) : (
                recentSubmissions.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-1 border-b border-gray-100 dark:border-slate-700 pb-2 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900 dark:text-slate-200">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 italic truncate">
                      &quot;{item.message}&quot;
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <Link
              href="/leads"
              className="text-xs text-blue-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
            >
              View Inbox Submissions <Play size={10} fill="currentColor" />
            </Link>
          </div>
        </div>

        {/* System & Operations */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2">
              System Integrations
            </h2>
            <div className="space-y-3 text-xs text-gray-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span>MySQL DB Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span>Cloudinary Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span>
                  Local Server:{" "}
                  <span className="font-mono bg-gray-100 dark:bg-slate-700 px-1 rounded text-slate-800 dark:text-slate-250">
                    Dev Bypass
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700 space-y-2">
            <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Operations Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-center font-semibold">
              <Link
                href="/admin/backup"
                className="border border-gray-200 dark:border-slate-700 rounded-lg py-2.5 px-1 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition truncate"
              >
                Backup
              </Link>
              <Link
                href="/admin/redirects"
                className="border border-gray-200 dark:border-slate-700 rounded-lg py-2.5 px-1 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition truncate"
              >
                Link Auditor
              </Link>
              <Link
                href="/admin/faq"
                className="border border-gray-200 dark:border-slate-700 rounded-lg py-2.5 px-1 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition truncate"
              >
                FAQ Editor
              </Link>
              <Link
                href="/admin/testimonials"
                className="border border-gray-200 dark:border-slate-700 rounded-lg py-2.5 px-1 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition truncate"
              >
                Reviews
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

