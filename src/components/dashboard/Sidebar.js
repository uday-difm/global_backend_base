"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import {
  LayoutDashboard,
  ImageIcon,
  FileText,
  Newspaper,
  Briefcase,
  Settings,
  Users,
  Inbox,
  Quote,
  HelpCircle,
  UsersRound,
  Database,
  ArrowLeftRight,
  PanelBottom,
  Layers,
  PanelTop,
  ShieldCheck,
  Phone,
  Megaphone,
  BarChart2,
  Scale,
  Menu,
  Mail,
  Activity,
  Bell,
  Fingerprint,
  Terminal,
  ChevronDown,
  ChevronRight,
  Globe,
} from "lucide-react";

const ROLE_LEVEL = {
  SUPERADMIN: 5,
  ADMIN: 4,
  EDITOR: 3,
  AUTHOR: 2,
  VIEWER: 1,
};

const crmSections = [
  {
    title: "CRM Overview",
    links: [
      {
        href: "/crm",
        label: "CRM Dashboard",
        icon: LayoutDashboard,
        minRole: "VIEWER",
      },
      {
        href: "/crm/subscribers",
        label: "Subscribers",
        icon: Users,
        minRole: "EDITOR",
      },
      {
        href: "/crm/lists",
        label: "Subscriber Lists",
        icon: UsersRound,
        minRole: "EDITOR",
      },
      {
        href: "/crm/leads",
        label: "Leads CRM",
        icon: Inbox,
        minRole: "EDITOR",
      },
      {
        href: "/crm/visitors",
        label: "Analytics Dashboard",
        icon: BarChart2,
        minRole: "VIEWER",
      },
      {
        href: "/crm?tab=reports",
        label: "Advanced Reports",
        icon: BarChart2,
        minRole: "VIEWER",
      },
    ],
  },
  {
    title: "Marketing",
    links: [
      {
        href: "/crm/campaigns",
        label: "Email Campaigns",
        icon: Megaphone,
        minRole: "EDITOR",
      },
      {
        href: "/crm/templates",
        label: "Email Templates",
        icon: Mail,
        minRole: "EDITOR",
      },
      {
        href: "/crm/push",
        label: "Push Notifications",
        icon: Bell,
        minRole: "EDITOR",
      },
      {
        href: "/crm/ads",
        label: "Advertisement Management",
        icon: Megaphone,
        minRole: "EDITOR",
      },
    ],
  },
  {
    title: "Moderation",
    links: [
      {
        href: "/crm/comments",
        label: "Comments",
        icon: Inbox,
        minRole: "EDITOR",
      },
      {
        href: "/crm/consent",
        label: "Cookie Consent",
        icon: Fingerprint,
        minRole: "EDITOR",
      },
    ],
  },
  {
    title: "System Settings",
    links: [
      {
        href: "/crm/email",
        label: "Email Settings",
        icon: Mail,
        minRole: "ADMIN",
      },
      {
        href: "/crm/notifications",
        label: "Notification Settings",
        icon: Bell,
        minRole: "ADMIN",
      },
    ],
  },
];

const sections = [
  {
    title: "Overview",
    links: [
      {
        href: "/dashboard/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        minRole: "VIEWER",
      },
    ],
  },

  {
    title: "Content",
    links: [
      {
        href: "/dashboard/pages",
        label: "Pages",
        icon: FileText,
        minRole: "EDITOR",
      },
      {
        href: "/dashboard/blogs",
        label: "Blogs",
        icon: Newspaper,
        minRole: "AUTHOR",
      },
      {
        href: "/dashboard/magazines",
        label: "Magazines",
        icon: Layers,
        minRole: "AUTHOR",
      },
      {
        href: "/dashboard/services",
        label: "Services",
        icon: Briefcase,
        minRole: "EDITOR",
      },
      {
        href: "/dashboard/media",
        label: "Media",
        icon: ImageIcon,
        minRole: "AUTHOR",
      },
      {
        href: "/dashboard/quizzes",
        label: "Quizzes",
        icon: HelpCircle,
        minRole: "EDITOR",
      },
    ],
  },

  {
    title: "Website",
    links: [
      {
        href: "/dashboard/navigation",
        label: "Navigation",
        icon: Menu,
        minRole: "EDITOR",
      },
      {
        href: "/dashboard/header",
        label: "Header Builder",
        icon: PanelTop,
        minRole: "ADMIN",
      },
      {
        href: "/dashboard/footer",
        label: "Footer Builder",
        icon: PanelBottom,
        minRole: "ADMIN",
      },
      {
        href: "/dashboard/cta",
        label: "CTA & Popups",
        icon: Megaphone,
        minRole: "ADMIN",
      },
      {
        href: "/dashboard/seo",
        label: "SEO",
        icon: BarChart2,
        minRole: "EDITOR",
      },
      {
        href: "/dashboard/contact",
        label: "Contact",
        icon: Phone,
        minRole: "EDITOR",
      },
      {
        href: "/dashboard/legal",
        label: "Legal Pages",
        icon: Scale,
        minRole: "EDITOR",
      },
    ],
  },

  {
    title: "People",
    links: [
      {
        href: "/dashboard/team",
        label: "Team",
        icon: UsersRound,
        minRole: "EDITOR",
      },
      {
        href: "/dashboard/testimonials",
        label: "Testimonials",
        icon: Quote,
        minRole: "EDITOR",
      },
      {
        href: "/dashboard/faq",
        label: "FAQs",
        icon: HelpCircle,
        minRole: "EDITOR",
      },
    ],
  },

  {
    title: "System",
    links: [
      {
        href: "/dashboard/users",
        label: "Users",
        icon: Users,
        minRole: "ADMIN",
      },
      {
        href: "/dashboard/security",
        label: "Security",
        icon: ShieldCheck,
        minRole: "ADMIN",
      },
      {
        href: "/dashboard/redirects",
        label: "Redirects",
        icon: ArrowLeftRight,
        minRole: "ADMIN",
      },
      {
        href: "/dashboard/notifications",
        label: "Notifications",
        icon: Bell,
        minRole: "ADMIN",
      },
    ],
  },
];

function canSee(userRole, minRole) {
  return (ROLE_LEVEL[userRole] || 0) >= (ROLE_LEVEL[minRole] || 0);
}

function SidebarLink({ href, label, icon: Icon, pathname }) {
  const isActive =
    pathname === href || (href !== "/dashboard/dashboard" && href !== "/crm" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all border ${isActive
          ? "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50 shadow-sm"
          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white border-transparent"
        }`}
    >
      <Icon
        size={14}
        className={
          isActive
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-slate-400 dark:text-slate-500"
        }
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const [advancedOpen, setAdvancedOpen] = useState(false);

  const userRole = session?.user?.globalRole || "VIEWER";
  const isCrmMode = pathname.startsWith("/crm");
  const isDashboardMode = pathname.startsWith("/dashboard");
  const activeSections = isCrmMode ? crmSections : sections;

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-56 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col transform transition-transform duration-200
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0
      `}
      >
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            {isCrmMode ? "Marketing CRM" : "Global CMS"}
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-3">
          {activeSections.map((section) => {
            const visibleLinks = section.links.filter((link) =>
              canSee(userRole, link.minRole),
            );

            if (!visibleLinks.length) return null;

            return (
              <div key={section.title}>
                <h5 className="px-2.5 mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  {section.title}
                </h5>

                <div className="space-y-0.5">
                  {visibleLinks.map((link) => (
                    <SidebarLink
                      key={link.label}
                      {...link}
                      pathname={pathname}
                    />
                  ))}
                </div>
              </div>
            );
          })}



          {/* Advanced (Only in CMS mode) */}
          {!isCrmMode && canSee(userRole, "ADMIN") && (
            <div>
              <button
                onClick={() => setAdvancedOpen(!advancedOpen)}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <span>Advanced</span>

                {advancedOpen ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>

               {advancedOpen && (
                <div className="mt-1 space-y-0.5">
                  <SidebarLink
                    href="/dashboard/backup"
                    label="Backup & Restore"
                    icon={Database}
                    pathname={pathname}
                  />

                  <SidebarLink
                    href="/dashboard/compliance"
                    label="Compliance"
                    icon={Fingerprint}
                    pathname={pathname}
                  />

                  <SidebarLink
                    href="/dashboard/performance"
                    label="Performance"
                    icon={Activity}
                    pathname={pathname}
                  />

                  <SidebarLink
                    href="/dashboard/dev"
                    label="Developer Tools"
                    icon={Terminal}
                    pathname={pathname}
                  />

                  <SidebarLink
                    href="/dashboard/settings"
                    label="Settings"
                    icon={Settings}
                    pathname={pathname}
                  />
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-slate-500 font-medium">
              {isCrmMode ? "CRM v1.0" : "CMS v1.0"}
            </span>

            <span className="rounded-full bg-indigo-600 dark:bg-indigo-700 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
              {userRole}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
