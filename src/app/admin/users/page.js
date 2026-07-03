// src/app/(dashboard)/users/page.js
import React from "react";
import prisma from "@/lib/prisma";
import CreateUserForm from "./CreateUserForm";
import UserDetailModal from "./UserDetailModal";
import DeleteUserButton from "./DeleteUserButton";
import { requireAuth } from "@/lib/requireAuth";
import { redirect } from "next/navigation";
import { Users, Shield, ShieldCheck, UserCheck, Activity } from "lucide-react";

export const metadata = {
  title: "User Management | CMS Admin",
  description:
    "Configure system roles, access policies, account statuses, and administrative overrides.",
};

export default async function UsersPage() {
  const sessionUser = await requireAuth();

  if (!sessionUser) {
    redirect("/login");
  }

  // Restrict access to SUPERADMIN and ADMIN
  if (
    sessionUser.globalRole !== "SUPERADMIN" &&
    sessionUser.globalRole !== "ADMIN"
  ) {
    redirect("/admin/dashboard");
  }

  // Fetch all active sites for site-access assignment
  const sites = await prisma.site.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true, name: true, domain: true },
    orderBy: { name: "asc" },
  });

  // Fetch users server-side, including 2FA status
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      globalRole: true,
      isActive: true,
      twoFAEnabled: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate metrics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const adminUsers = users.filter(
    (u) => u.globalRole === "SUPERADMIN" || u.globalRole === "ADMIN",
  ).length;
  const usersWith2Fa = users.filter((u) => u.twoFAEnabled).length;

  // Helper to resolve role styles
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "SUPERADMIN":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "ADMIN":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "EDITOR":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "AUTHOR":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "VIEWER":
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Admin Access & Roles
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Add users, deactivate accounts, assign administrative roles, and
            override credential security policies.
          </p>
        </div>
        <div className="shrink-0">
          <CreateUserForm sites={JSON.parse(JSON.stringify(sites))} />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
            <Users size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Total Members
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {totalUsers}
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-50 text-green-600">
            <UserCheck size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Active Members
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {activeUsers}
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
            <Shield size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Admins / Managers
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {adminUsers}
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              MFA Protected
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {usersWith2Fa}
            </div>
          </div>
        </div>
      </div>

      {/* Main Users Table Layout */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-150 text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">User Identity</th>
                <th className="px-6 py-4">System Role</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4">Two-Factor (2FA)</th>
                <th className="px-6 py-4">Enrollment Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100 font-medium text-gray-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {/* Avatar initials */}
                      <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs border uppercase">
                        {u.email.substring(0, 2)}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 block">
                          {u.email}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono block">
                          ID: {u.id}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${getRoleBadgeClass(u.globalRole)}`}
                    >
                      {u.globalRole}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 border border-green-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {u.twoFAEnabled ? (
                      <span className="inline-flex items-center gap-1 text-blue-600 font-bold">
                        <ShieldCheck
                          size={14}
                          className="shrink-0 text-blue-500"
                        />
                        Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-400">
                        <Shield size={14} className="shrink-0" />
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                    {new Date(u.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold space-x-1">
                    <UserDetailModal userId={u.id} />
                    {sessionUser.id !== u.id && (
                      <DeleteUserButton userId={u.id} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <Users className="mx-auto text-gray-300" size={32} />
            <p className="text-sm font-semibold">
              No administrator users found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

