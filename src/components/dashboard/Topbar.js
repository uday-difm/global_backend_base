"use client";

import { useState, useRef, useEffect } from "react";
import {
  Menu,
  Search,
  Bell,
  UserCircle,
  LogOut,
  ChevronDown,
  Inbox,
  AlertTriangle,
  Newspaper,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";

export default function Topbar({ siteId, sites = [], onMenuClick }) {
  const [showSearch, setShowSearch] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const menuRef = useRef(null);
  const notificationsRef = useRef(null);
  const searchRef = useRef(null);
  const { data: session } = useSession();
  const router = useRouter();
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userEmail = session?.user?.email ?? "Admin";
  const userRole = session?.user?.globalRole ?? "—";

  // Fetch Alerts
  const fetchAlerts = async () => {
    if (!siteId) return;
    try {
      const res = await fetch("/api/dashboard/notifications", {
        headers: {
          "x-site-id": siteId,
        },
      });
      if (res.ok) {
        const json = await res.json();
        setAlerts(json.data?.alerts ?? (json.alerts || []));
        setUnreadCount(json.data?.unreadCount ?? (json.unreadCount || 0));
      }
    } catch (e) {
      console.error("Failed to load alerts in Topbar:", e);
    }
  };

  useEffect(() => {
    if (session && siteId) {
      fetchAlerts();
      const timer = setInterval(fetchAlerts, 30000); // Poll every 30s
      return () => clearInterval(timer);
    }
  }, [session, siteId]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target)
      ) {
        setNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setMenuOpen(false);
    await signOut({ callbackUrl: `${window.location.origin}/login` });
  }

  const handleMarkAllRead = async () => {
    if (!siteId) return;
    try {
      const res = await fetch("/api/dashboard/notifications/read", {
        method: "PUT",
        headers: {
          "x-site-id": siteId,
        },
      });
      if (res.ok) {
        setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    if (!siteId) return;
    try {
      const res = await fetch("/api/dashboard/notifications", {
        method: "DELETE",
        headers: {
          "x-site-id": siteId,
        },
      });
      if (res.ok) {
        setAlerts([]);
        setUnreadCount(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "NEW_LEAD":
        return <Inbox size={15} className="text-blue-500" />;
      case "FAILED_FORM":
        return <AlertTriangle size={15} className="text-red-500" />;
      case "BLOG_ALERT":
        return <Newspaper size={15} className="text-green-500" />;
      default:
        return <Bell size={15} className="text-gray-500" />;
    }
  };

  const searchItems = [
    { name: "Dashboard", href: "/dashboard/dashboard" },
    { name: "Pages", href: "/dashboard/pages" },
    { name: "Blogs", href: "/dashboard/blogs" },
    { name: "Services", href: "/dashboard/services" },
    { name: "Media Library", href: "/dashboard/media" },
    { name: "Leads CRM", href: "/crm/leads" },
    { name: "Visitor Analytics", href: "/crm/visitors" },
    { name: "Users", href: "/dashboard/users" },
    { name: "Settings", href: "/dashboard/settings" },
    { name: "Testimonials", href: "/dashboard/testimonials" },
    { name: "FAQs", href: "/dashboard/faq" },
    { name: "Team Members", href: "/dashboard/team" },
    { name: "Contact Details", href: "/dashboard/contact" },
    { name: "Legal Pages", href: "/dashboard/legal" },
    { name: "Navigation Menus", href: "/dashboard/navigation" },
    { name: "Header Builder", href: "/dashboard/header" },
    { name: "Footer Builder", href: "/dashboard/footer" },
    { name: "CTA & Popups", href: "/dashboard/cta" },
    { name: "Notifications", href: "/dashboard/notifications" },
    { name: "Security Center", href: "/dashboard/security" },
  ];

  const filteredItems = searchQuery
    ? searchItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : searchItems;
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.querySelector("#cms-search")?.focus();
      }
    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, []);
  return (
    <>
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-900">
        <div className="flex h-16 items-center justify-between px-3 sm:px-4 md:px-6">
          {/* Left */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuClick}
              className="rounded-lg p-2 hover:bg-slate-150 dark:hover:bg-slate-700 md:hidden"
            >
              <Menu size={20} />
            </button>
 
            <div className="hidden xl:block">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white md:text-xl">
                Admin Panel
              </h1>
              <p className="hidden text-sm text-gray-500 dark:text-slate-400 xl:block">
                Manage your website content
              </p>
            </div>
 
            {sites.length > 1 && (
              <div className="relative ml-1 sm:ml-2">
                <select
                  value={siteId || ""}
                  onChange={async (e) => {
                    const newSiteId = e.target.value;
                    if (!newSiteId || newSiteId === siteId) return;
                    try {
                      const res = await fetch("/api/dashboard/switch-site", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ siteId: newSiteId }),
                      });
                      if (res.ok) {
                        window.location.reload();
                      } else {
                        const err = await res.json();
                        toast.error(err.error || "Failed to switch site");
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 text-[11px] font-bold rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-1.5 px-2.5 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors max-w-[120px] xs:max-w-[160px] sm:max-w-xs truncate"
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      🌐 {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
 
          {/* Right */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-4">
            {/* Desktop Search */}
            <div ref={searchRef} className="relative hidden md:block">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                id="cms-search"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search modules..."
                className="w-64 rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-black"
              />

              {searchOpen && searchQuery && (
                <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-xl border bg-white shadow-xl z-50">
                  {filteredItems.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">
                      No results found
                    </div>
                  ) : (
                    filteredItems.slice(0, 8).map((item) => (
                      <button
                        key={item.href}
                        onClick={() => {
                          router.push(item.href);
                          setSearchQuery("");
                          setSearchOpen(false);
                        }}
                        className="flex w-full items-center px-4 py-3 text-left text-sm hover:bg-gray-50"
                      >
                        {item.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-slate-700 md:hidden"
            >
              <Search size={18} />
            </button>

            {/* Dynamic Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  if (!notificationsOpen) {
                    fetchAlerts();
                  }
                }}
                className="relative rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold leading-none text-white bg-red-600 rounded-full animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl overflow-hidden z-50 text-xs text-left">
                  {/* Popover Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 px-4 py-3">
                    <span className="font-bold text-gray-800 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                      Notifications ({unreadCount} new)
                    </span>
                    {alerts.length > 0 && (
                      <div className="flex gap-2">
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[9px] font-bold text-blue-600 hover:text-blue-700 select-none border-0 bg-transparent cursor-pointer"
                        >
                          Mark all read
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={handleClearAll}
                          className="text-[9px] font-bold text-red-600 hover:text-red-700 select-none border-0 bg-transparent cursor-pointer"
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Popover list */}
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 transition-colors ${
                          alert.isRead
                            ? "bg-white dark:bg-slate-800"
                            : "bg-blue-50/30 hover:bg-blue-50/50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20"
                        }`}
                      >
                        <div className="flex gap-2.5 items-start">
                          <div className="mt-0.5 shrink-0">
                            {getAlertIcon(alert.type)}
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex justify-between items-start gap-1">
                              <span className="font-bold text-gray-900 dark:text-slate-100 leading-tight">
                                {alert.title}
                              </span>
                              {!alert.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-gray-500 dark:text-slate-400 leading-normal text-[11px]">
                              {alert.message}
                            </p>
                            <span className="text-[9px] text-gray-400 dark:text-slate-500 block mt-1">
                              {new Date(alert.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {alerts.length === 0 && (
                      <div className="p-8 text-center text-gray-400 dark:text-slate-500 italic">
                        No recent system alerts.
                      </div>
                    )}
                  </div>

                  {/* Popover Footer */}
                  <Link
                    href="/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className="block text-center border-t border-gray-100 dark:border-slate-700 py-2.5 bg-gray-50/50 dark:bg-slate-900/50 hover:bg-gray-50 dark:hover:bg-slate-700 font-semibold text-[10px] text-gray-600 dark:text-slate-300 transition"
                  >
                    Manage Settings & Alerts History
                  </Link>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button
                id="user-menu-btn"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-gray-200 dark:border-slate-700 p-1.5 sm:px-3 sm:py-2 transition hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                <UserCircle size={22} className="text-gray-600 dark:text-slate-400 shrink-0" />

                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight max-w-[140px] truncate">
                    {userEmail}
                  </p>
                  <p className="text-xs text-gray-500">{userRole}</p>
                </div>

                <ChevronDown
                  size={14}
                  className={`hidden lg:block text-gray-400 transition-transform ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown */}
              {menuOpen && (
                 <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden z-50">
                   {/* User info header */}
                   <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                     <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                       Signed in as
                     </p>
                     <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate mt-0.5">
                       {userEmail}
                     </p>
                     <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                       {userRole}
                     </span>
                   </div>
 
                   {/* Logout */}
                   <button
                     id="logout-btn"
                     onClick={handleLogout}
                     className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                   >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showSearch && (
          <div ref={searchRef} className="border-t bg-white p-3 md:hidden">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-3 text-gray-400"
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search modules..."
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-black"
              />

              {searchOpen && searchQuery && (
                <div className="mt-2 overflow-hidden rounded-xl border bg-white shadow-lg">
                  {filteredItems.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">
                      No results found
                    </div>
                  ) : (
                    filteredItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          setSearchQuery("");
                          setSearchOpen(false);
                          setShowSearch(false);
                        }}
                        className="flex w-full items-center px-4 py-3 text-sm hover:bg-gray-50 border-b last:border-b-0"
                      >
                        {item.name}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
