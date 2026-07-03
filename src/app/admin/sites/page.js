import React from "react";
import prisma from "@/lib/prisma";
import CreateSiteForm from "./CreateSiteForm";
import SiteRow from "./SiteRow";
import { requireAuth } from "@/lib/requireAuth";
import { redirect } from "next/navigation";
import { Globe, Activity, FileText, Newspaper, Users } from "lucide-react";

export const metadata = {
  title: "Sites | CMS Admin",
  description: "Manage all sites in the CMS",
};

export default async function SitesPage() {
  const sessionUser = await requireAuth();

  if (!sessionUser) {
    redirect("/login");
  }

  if (
    sessionUser.globalRole !== "SUPERADMIN" &&
    sessionUser.globalRole !== "ADMIN"
  ) {
    redirect("/admin/dashboard");
  }

  const sites = await prisma.site.findMany({
    where: { deletedAt: null },
    include: {
      _count: {
        select: {
          users: true,
          pages: { where: { deletedAt: null } },
          posts: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalSites = sites.length;
  const activeSites = sites.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Sites
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage multi-site instances.
          </p>
        </div>
        <div className="shrink-0">
          <CreateSiteForm />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
            <Globe size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Total Sites
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {totalSites}
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-50 text-green-600">
            <Activity size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Active
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {activeSites}
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <FileText size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Total Pages
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {sites.reduce((sum, s) => sum + s._count.pages, 0)}
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
            <Newspaper size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Total Posts
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {sites.reduce((sum, s) => sum + s._count.posts, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Sites Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-150 text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Site</th>
                <th className="px-6 py-4">Domain</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Pages</th>
                <th className="px-6 py-4 text-center">Posts</th>
                <th className="px-6 py-4 text-center">Users</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 font-medium text-gray-700">
              {sites.map((site) => (
                <SiteRow key={site.id} site={site} currentUserId={sessionUser.id} />
              ))}
            </tbody>
          </table>
        </div>

        {sites.length === 0 && (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <Globe className="mx-auto text-gray-300" size={32} />
            <p className="text-sm font-semibold">No sites yet.</p>
            <p className="text-xs">Create your first site to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

