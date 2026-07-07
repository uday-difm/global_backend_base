import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import DeleteMagazineButton from "./DeleteMagazineButton";
import { requireAuth } from "@/lib/requireAuth";
import { getSiteForUser } from "@/lib/getSiteForUser";
import {
  BookOpen,
  Plus,
  Calendar,
  Layers,
  ExternalLink,
  Pencil,
} from "lucide-react";

export const metadata = {
  title: "Magazines | CMS Admin",
  description: "Manage magazines, upload covers, and track PDF links.",
};

export default async function MagazinesAdmin() {
  const user = await requireAuth();
  if (!user) return null;

  const siteId = "ebh";

  // Fetch magazines
  const magazines = await prisma.magazine.findMany({
    orderBy: { date: "desc" },
  });

  const totalCount = magazines.length;
  const publishedCount = magazines.filter((m) => m.status === 1).length;
  const draftCount = magazines.filter((m) => m.status === 0).length;

  return (
    <div className="p-4 md:p-6 space-y-6 w-full text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Magazines</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your digital magazines, issues, categories, and MagCloud publication links.
          </p>
        </div>
        <Link
          href="/dashboard/magazines/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
        >
          <Plus size={14} />
          Add Magazine
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Magazines</div>
          <div className="text-2xl font-bold mt-1">{totalCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Published</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">{publishedCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Drafts</div>
          <div className="text-2xl font-bold mt-1 text-amber-600">{draftCount}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Cover</th>
                <th className="p-4">Title</th>
                <th className="p-4">Date</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {magazines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No magazines found. Click "Add Magazine" to create your first issue.
                  </td>
                </tr>
              ) : (
                magazines.map((mag) => (
                  <tr key={mag.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      {mag.coverImage ? (
                        <img
                          src={mag.coverImage}
                          alt={mag.title}
                          className="h-14 w-10 object-cover rounded shadow-sm border border-slate-200 dark:border-slate-800"
                        />
                      ) : (
                        <div className="h-14 w-10 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center border border-slate-200 dark:border-slate-800">
                          <BookOpen size={16} className="text-slate-400" />
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-semibold max-w-xs truncate">
                      {mag.title}
                      <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                        Slug: {mag.slug}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(mag.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Layers size={12} />
                        {mag.category}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          mag.status === 1
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                        }`}
                      >
                        {mag.status === 1 ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <Link
                        href={`/magazine/${mag.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold transition cursor-pointer"
                        title="View Live"
                      >
                        <ExternalLink size={11} />
                        View
                      </Link>
                      <Link
                        href={`/dashboard/magazines/${mag.slug}/edit`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                        title="Edit Magazine"
                      >
                        <Pencil size={11} />
                        Edit
                      </Link>
                      <DeleteMagazineButton magazineSlug={mag.slug} siteId={siteId} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
