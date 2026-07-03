// src/app/(dashboard)/pages/page.js
import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import CreatePageForm from "./CreatePageForm";
import PublishToggle from "./PublishToggle";
import DeletePageButton from "./DeletePageButton";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/requireAuth";
import { getSiteForUser } from "@/lib/getSiteForUser";
import { headers } from "next/headers";
import {
  FileText,
  Eye,
  Edit2,
  FilePlus2,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

export const metadata = {
  title: "Pages Management | CMS Admin",
  description:
    "Create pages, edit layouts, modify text/images, and toggle publishing statuses.",
};

function resolveFrontendUrl(value, requestHost) {
  const fallback = process.env.FRONTEND_URL || "http://localhost:3001";

  if (requestHost) {
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    if (!value || value.includes("localhost") || value.includes("127.0.0.1")) {
      return `${protocol}://${requestHost}`;
    }
  }

  const raw = (value || fallback).trim();
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;

  try {
    const url = new URL(withProtocol);
    return url.href.replace(/\/+$/, "");
  } catch {
    return fallback.replace(/\/+$/, "");
  }
}

export default async function PagesAdmin() {
  const user = await requireAuth();
  if (!user) return null;
  if (user.globalRole === "VIEWER") redirect("/admin/dashboard");

  const site = await getSiteForUser(user);

  if (!site) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
        <p className="mt-4 text-sm text-red-655">
          No active tenant site configured for your profile.
        </p>
      </div>
    );
  }

  // Fetch frontend URL from settings
  const settings = await prisma.globalSettings.findUnique({
    where: { siteId: site.id },
    select: { websiteSettings: true },
  });
  const requestHeaders = await headers();
  const frontendUrl = resolveFrontendUrl(
    settings?.websiteSettings?.domain,
    requestHeaders.get("host")
  );

  // Retrieve all pages under this site
  const pages = await prisma.page.findMany({
    where: { siteId: site.id, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });

  // Calculate metrics
  const totalPages = pages.length;
  const publishedPages = pages.filter((p) => p.status === "PUBLISHED").length;
  const draftPages = pages.filter((p) => p.status === "DRAFT").length;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Pages Manager
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Site:{" "}
            <span className="font-semibold text-gray-800">{site.name}</span> (
            {site.domain || site.id})
          </p>
        </div>
        <div className="shrink-0">
          <CreatePageForm siteId={site.id} />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
            <FileText size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Total Pages
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {totalPages}
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-50 text-green-600">
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Published
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {publishedPages}
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-slate-50 text-slate-600">
            <FilePlus2 size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Drafts
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {draftPages}
            </div>
          </div>
        </div>
      </div>

      {/* Main Pages Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-150 text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Page Title & ID</th>
                <th className="px-6 py-4">Access Slug Path</th>
                <th className="px-6 py-4">Publishing Status</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100 font-medium text-gray-700">
              {pages.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                        <FileText size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 block">
                            {p.title}
                          </span>
                          {p.isHardcoded && (
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 ring-1 ring-inset ring-amber-600/20 uppercase tracking-wider shrink-0">
                              🔒 Hardcoded Frontend Route
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono block">
                          ID: {p.id}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={`${frontendUrl}${p.slug || "/"}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-indigo-600 hover:text-indigo-800 bg-gray-50 px-2 py-1 rounded border hover:bg-indigo-50/10 transition"
                    >
                      {p.slug || "/"}
                    </a>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {p.isHardcoded ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200 uppercase tracking-wider">
                        Always Active
                      </span>
                    ) : p.status === "PUBLISHED" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-bold text-green-700 border border-green-200 uppercase tracking-wider">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200 uppercase tracking-wider">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Draft
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                    {new Date(p.updatedAt).toLocaleString()}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold space-x-1.5">
                    {/* Edit button */}
                    <Link
                      href={`/admin/pages/${p.id}/edit`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-sm transition"
                    >
                      <Edit2 size={12} />
                      Edit Builder
                    </Link>

                    {/* Preview button */}
                    <a
                      href={`${frontendUrl}/preview?pageId=${p.id}&siteId=${site.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-sm transition"
                    >
                      <Eye size={12} />
                      Preview
                    </a>

                    {/* Publish/Draft toggle */}
                    {!p.isHardcoded && (
                      <PublishToggle
                        pageId={p.id}
                        initialStatus={p.status}
                        siteId={site.id}
                      />
                    )}

                    {/* Delete button */}
                    {!p.isHardcoded && (
                      <DeletePageButton pageId={p.id} siteId={site.id} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages.length === 0 && (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <FileText className="mx-auto text-gray-300" size={32} />
            <p className="text-sm font-semibold">No pages created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

