import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import DeletePostButton from "./DeletePostButton";
import CategoryManager from "./CategoryManager";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/requireAuth";
import { getSiteForUser } from "@/lib/getSiteForUser";
import {
  FileText,
  CheckCircle,
  Clock,
  CalendarClock,
  Plus,
  Tag,
  User,
} from "lucide-react";

export const metadata = {
  title: "Blog & Resources | CMS Admin",
  description:
    "Manage blog posts, categories, author assignments, featured images, and scheduled publications.",
};

export default async function BlogsAdmin({ searchParams: rawSearchParams }) {
  const user = await requireAuth();
  if (!user) return null;
  if (user.globalRole === "VIEWER") redirect("/admin/dashboard");

  const site = await getSiteForUser(user);
  if (!site) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-900">Blog & Resources</h1>
        <p className="mt-4 text-sm text-rose-600">
          No active site configured for your profile.
        </p>
      </div>
    );
  }

  const searchParams = await rawSearchParams;
  const statusFilter = searchParams?.status || "ALL";

  // Build posts query
  const where = { siteId: site.id, deletedAt: null };
  if (statusFilter === "PUBLISHED") {
    where.status = "PUBLISHED";
    where.publishedAt = { lte: new Date() };
  } else if (statusFilter === "DRAFT") {
    where.status = "DRAFT";
  } else if (statusFilter === "SCHEDULED") {
    where.publishedAt = { gt: new Date() };
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      author: { select: { id: true, email: true } },
      categories: true,
      featuredImage: { select: { url: true, secureUrl: true, altText: true } },
    },
  });

  // Full counts (unfiltered) for metric cards
  const allPosts = await prisma.post.findMany({
    where: { siteId: site.id, deletedAt: null },
    select: { status: true, publishedAt: true },
  });
  const now = new Date();
  const totalCount = allPosts.length;
  const publishedCount = allPosts.filter(
    (p) =>
      p.status === "PUBLISHED" &&
      p.publishedAt &&
      new Date(p.publishedAt) <= now,
  ).length;
  const draftCount = allPosts.filter(
    (p) =>
      p.status === "DRAFT" &&
      (!p.publishedAt || new Date(p.publishedAt) <= now),
  ).length;
  const scheduledCount = allPosts.filter(
    (p) => p.publishedAt && new Date(p.publishedAt) > now,
  ).length;

  // Categories scoped to this site
  const categories = await prisma.category.findMany({
    where: { siteId: site.id },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          posts: {
            where: { siteId: site.id, deletedAt: null },
          },
        },
      },
    },
  });

  const filters = [
    { label: "All Posts", value: "ALL", count: totalCount },
    { label: "Published", value: "PUBLISHED", count: publishedCount },
    { label: "Draft", value: "DRAFT", count: draftCount },
    { label: "Scheduled", value: "SCHEDULED", count: scheduledCount },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Blog & Resources
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Site:{" "}
            <span className="font-semibold text-slate-700">{site.name}</span>{" "}
            <span className="text-slate-400">({site.domain || site.id})</span>
          </p>
        </div>
        <Link
          href="/admin/blogs/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/10 transition-all duration-200"
        >
          <Plus size={14} />
          Create New Post
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <FileText size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {totalCount}
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-green-50 text-green-600">
            <CheckCircle size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Published
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {publishedCount}
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Drafts
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {draftCount}
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <CalendarClock size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Scheduled
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {scheduledCount}
            </div>
          </div>
        </div>
      </div>

      {/* Content area: table + categories sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Posts table */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filter Tabs */}
          <div className="bg-white border border-slate-100 rounded-2xl p-1.5 shadow-xs inline-flex gap-1 flex-wrap">
            {filters.map((f) => {
              const isActive = statusFilter === f.value;
              return (
                <Link
                  key={f.value}
                  href={`/admin/blogs${f.value === "ALL" ? "" : `?status=${f.value}`}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {f.label}
                  <span
                    className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {f.count}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Post
                    </th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Categories
                    </th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Publish Date
                    </th>
                    <th className="px-5 py-3.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {posts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <FileText
                          className="mx-auto text-slate-200 mb-2"
                          size={36}
                        />
                        <p className="text-sm font-semibold text-slate-500">
                          No posts found.
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {statusFilter !== "ALL"
                            ? "Try changing the filter above."
                            : "Create your first blog post!"}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    posts.map((post) => {
                      const isScheduled =
                        post.publishedAt && new Date(post.publishedAt) > now;
                      const isPublished =
                        post.status === "PUBLISHED" &&
                        (!post.publishedAt ||
                          new Date(post.publishedAt) <= now);
                      const coverUrl =
                        post.featuredImage?.secureUrl ||
                        post.featuredImage?.url;

                      // Author initials
                      const authorEmail = post.author?.email || "System";
                      const initials = authorEmail
                        .split("@")[0]
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <tr
                          key={post.id}
                          className="group hover:bg-slate-50/40 transition-colors duration-100"
                        >
                          {/* Post title + slug + thumbnail */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {coverUrl ? (
                                <div className="w-12 h-9 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                                  <img
                                    src={coverUrl}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-9 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center border border-slate-100">
                                  <FileText
                                    size={14}
                                    className="text-slate-300"
                                  />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-800 truncate max-w-[220px]">
                                  {post.title}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[220px]">
                                  /{post.slug}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Categories */}
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {post.categories.length === 0 ? (
                                <span className="text-slate-300 italic text-[10px]">
                                  None
                                </span>
                              ) : (
                                post.categories.map((cat) => (
                                  <span
                                    key={cat.id}
                                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                                  >
                                    <Tag size={8} />
                                    {cat.name}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>

                          {/* Author */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {initials}
                              </div>
                              <span className="text-slate-600 text-[11px] truncate max-w-[100px]">
                                {authorEmail}
                              </span>
                            </div>
                          </td>

                          {/* Status badge */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            {isScheduled ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <CalendarClock size={9} />
                                Scheduled
                              </span>
                            ) : isPublished ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                Published
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Draft
                              </span>
                            )}
                          </td>

                          {/* Publish date */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            {post.publishedAt ? (
                              <div>
                                <div className="text-slate-600 text-[11px] font-medium">
                                  {new Date(
                                    post.publishedAt,
                                  ).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {new Date(
                                    post.publishedAt,
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-300 italic text-[10px]">
                                Not set
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <Link
                                href={`/admin/blogs/${post.id}/edit`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition"
                              >
                                Edit Post
                              </Link>
                              <DeletePostButton
                                postId={post.id}
                                siteId={site.id}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Category sidebar */}
        <div className="lg:col-span-1">
          <CategoryManager initialCategories={categories} siteId={site.id} />
        </div>
      </div>
    </div>
  );
}

