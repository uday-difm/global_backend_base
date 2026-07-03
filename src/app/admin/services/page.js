// src/app/(dashboard)/services/page.js
import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import DeleteServiceButton from "./DeleteServiceButton";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/requireAuth";
import { getSiteForUser } from "@/lib/getSiteForUser";
import { Briefcase, CheckCircle, FileText, Plus, DollarSign, ListOrdered } from "lucide-react";

export const metadata = {
  title: "Service Management | CMS Admin",
  description: "Configure business services, pricing tags, CTAs, custom descriptions, and specific page FAQs.",
};

export default async function ServicesAdmin() {
  const user = await requireAuth();
  if (!user) return null;
  if (user.globalRole === "VIEWER") redirect("/admin/dashboard");

  // Retrieve site config securely
  const site = await getSiteForUser(user);
  if (!site) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <p className="mt-4 text-sm text-red-600">No active site configured for your profile.</p>
      </div>
    );
  }

  // Retrieve services scoped to this site
  const services = await prisma.service.findMany({
    where: { siteId: site.id, deletedAt: null },
    orderBy: { sortOrder: "asc" },
  });

  // Calculate stats metrics
  const totalServices = services.length;
  const activeServices = services.filter((s) => s.status === "ACTIVE").length;
  const draftServices = services.filter((s) => s.status === "DRAFT").length;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Service Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Site: <span className="font-semibold text-gray-800">{site.name}</span> ({site.domain || site.id})
          </p>
        </div>
        <div className="shrink-0">
          <Link
            href="/admin/services/new"
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-green-700 transition"
          >
            <Plus size={14} />
            Create Service
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
            <Briefcase size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Services</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">{totalServices}</div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-50 text-green-600">
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Services</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">{activeServices}</div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-slate-50 text-slate-600">
            <FileText size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Draft Services</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">{draftServices}</div>
          </div>
        </div>
      </div>

      {/* Services Table List */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-150 text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Service Details & Order</th>
                <th className="px-6 py-4">Price Tag</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100 font-medium text-gray-700">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                        <Briefcase size={16} />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 block">{s.title}</span>
                        <span className="text-[10px] text-gray-400 font-mono block">Order Weight: {s.sortOrder}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-gray-950 font-bold">
                    {s.price ? (
                      <span className="inline-flex items-center gap-0.5 text-slate-800">
                        <DollarSign size={12} className="text-slate-400" />
                        {s.price}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic font-normal">Contact for Quote</span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {s.status === "ACTIVE" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-bold text-green-700 border border-green-200 uppercase tracking-wider">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200 uppercase tracking-wider">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Draft
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                    {new Date(s.updatedAt).toLocaleString()}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold space-x-1.5">
                    <Link
                      href={`/admin/services/${s.id}/edit`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-sm transition"
                    >
                      Edit Service
                    </Link>
                    <DeleteServiceButton serviceId={s.id} siteId={site.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {services.length === 0 && (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <Briefcase className="mx-auto text-gray-300" size={32} />
            <p className="text-sm font-semibold">No services configured yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

