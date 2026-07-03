"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export default function DashboardLayout({ children, siteId, sites = [] }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (siteId && typeof window !== "undefined") {
      localStorage.setItem("x-site-id", siteId);
    }
  }, [siteId]);

  return (
    <div className="dashboard-layout flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <Sidebar
        siteId={siteId}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          siteId={siteId}
          sites={sites}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">{children}</main>
        <style>{`
                  .dark .dashboard-layout :where(.bg-white) { background-color: #1e293b !important; }
                  .dark .dashboard-layout :where(.bg-gray-50, .bg-slate-50) { background-color: #1e293b !important; }
                  .dark .dashboard-layout :where(td, th, .border-gray-100, .border-gray-200, .border-gray-150, .border-slate-100, .border-slate-200) { border-color: #334155 !important; }
                  .dark .dashboard-layout :where(.divide-gray-100, .divide-gray-150, .divide-slate-100) > * { border-color: #334155 !important; }
                  .dark .dashboard-layout :where(.text-gray-800, .text-slate-800) { color: #e2e8f0 !important; }
                  .dark .dashboard-layout :where(.text-gray-900, .text-slate-900) { color: #f1f5f9 !important; }
                  .dark .dashboard-layout :where(.text-gray-700, .text-slate-700) { color: #cbd5e1 !important; }
                  .dark .dashboard-layout :where(.text-gray-600, .text-slate-600) { color: #94a3b8 !important; }
                  .dark .dashboard-layout :where(.text-gray-500, .text-slate-500) { color: #94a3b8 !important; }
                  .dark .dashboard-layout :where(.text-gray-400, .text-slate-400) { color: #64748b !important; }
                  .dark .dashboard-layout :where(.text-gray-300, .text-slate-300) { color: #cbd5e1 !important; }
                  .dark .dashboard-layout :where(.text-blue-600, .text-blue-700) { color: #60a5fa !important; }
                  .dark .dashboard-layout :where(.text-indigo-600, .text-indigo-700) { color: #818cf8 !important; }
                  .dark .dashboard-layout :where(.text-green-600, .text-green-700) { color: #4ade80 !important; }
                  .dark .dashboard-layout :where(.text-amber-600, .text-amber-700) { color: #fbbf24 !important; }
                  .dark .dashboard-layout :where(.text-red-600, .text-red-700) { color: #f87171 !important; }
                  .dark .dashboard-layout :where(.text-emerald-600, .text-emerald-700) { color: #34d399 !important; }
                  .dark .dashboard-layout :where(.shadow-sm) { box-shadow: 0 1px 2px 0 rgba(0,0,0,0.3) !important; }
                  .dark .dashboard-layout :where(.hover\\:bg-gray-50):hover,
                  .dark .dashboard-layout :where(.hover\\:bg-slate-50):hover { background-color: #334155 !important; }
                  .dark .dashboard-layout :where(input:not([type="checkbox"]):not([type="radio"]), textarea, select) {
                    background-color: #0f172a !important;
                    color: #e2e8f0 !important;
                    border-color: #475569 !important;
                  }
                  .dark .dashboard-layout :where(input::placeholder, textarea::placeholder) { color: #64748b !important; }
                  .dark .dashboard-layout :where(.bg-blue-50) { background-color: #1e3a5f !important; }
                  .dark .dashboard-layout :where(.bg-green-50) { background-color: #064e3b !important; }
                  .dark .dashboard-layout :where(.bg-red-50) { background-color: #7f1d1d !important; }
                  .dark .dashboard-layout :where(.bg-amber-50) { background-color: #78350f !important; }
                  .dark .dashboard-layout :where(.bg-emerald-50) { background-color: #064e3b !important; }
                  .dark .dashboard-layout :where(.bg-indigo-50) { background-color: #312e81 !important; }
                `}</style>
      </div>
    </div>
  );
}
