"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Calendar, Tag, ExternalLink, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function MagazinesPage() {
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchMagazines = async (query = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/magazines?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (res.ok) {
        setMagazines(data.magazines || []);
      } else {
        toast.error(data.error || "Failed to load magazines");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error loading magazines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMagazines(search);
  }, [search]);

  const handleDelete = async (slug) => {
    if (!confirm("Are you sure you want to delete this magazine issue?")) return;

    try {
      const res = await fetch(`/api/dashboard/magazines/${slug}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Magazine issue deleted successfully");
        fetchMagazines(search);
      } else {
        toast.error(data.error || "Failed to delete magazine");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error deleting magazine");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Magazine Management</h1>
          <p className="text-sm text-slate-500">Create, edit, and organize digital and physical print magazine issues.</p>
        </div>
        <Link
          href="/dashboard/magazines/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition-colors"
        >
          <Plus size={14} /> New Issue
        </Link>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, category, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-0 pl-10 pr-3 py-1 text-sm outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
        </div>
      </div>

      {/* List / Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : magazines.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <p className="text-slate-400 italic">No magazine issues found.</p>
          <Link
            href="/dashboard/magazines/new"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
          >
            Create your first issue <Plus size={12} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {magazines.map((mag) => (
            <div
              key={mag.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Cover Image */}
                <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-950 relative overflow-hidden group border-b border-slate-200 dark:border-slate-800">
                  {mag.coverImage ? (
                    <img
                      src={mag.coverImage}
                      alt={mag.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700 italic text-xs">
                      No cover image
                    </div>
                  )}
                  {/* Status Badge */}
                  <span
                    className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                      mag.status === 1
                        ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900/40"
                        : "bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {mag.status === 1 ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1 text-sm">
                    {mag.title}
                  </h3>
                  {mag.description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {mag.description}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-2 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(mag.date).toLocaleDateString()}
                    </span>
                    {mag.category && (
                      <span className="flex items-center gap-1">
                        <Tag size={12} />
                        {mag.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-slate-150 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  {mag.link && (
                    <a
                      href={mag.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded transition"
                      title="View Digital Link"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  {mag.magCloudLink && (
                    <a
                      href={mag.magCloudLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded transition text-[10px] font-bold px-2 flex items-center gap-1"
                      title="MagCloud Link"
                    >
                      MagCloud
                    </a>
                  )}
                </div>

                <div className="flex gap-1.5">
                  <Link
                    href={`/dashboard/magazines/${mag.slug}/edit`}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                  >
                    <Edit size={14} />
                  </Link>
                  <button
                    onClick={() => handleDelete(mag.slug)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
