"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Upload, Calendar, Link as LinkIcon, Tag, Layers, FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import dynamic from "next/dynamic";

// Dynamically import Jodit Editor to prevent server-side rendering issues
const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

export default function MagazineEditor({ initialData = null }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverPreview, setCoverPreview] = useState(initialData?.coverImage || null);
  const coverFileRef = useRef(null);

  const [values, setValues] = useState({
    magazine_id: initialData?.magazineId || "",
    magazine_title: initialData?.title || "",
    magazine_description: initialData?.description || "",
    magazine_tags: initialData?.tags || "",
    magazine_link: initialData?.link || "",
    magazine_date: initialData?.date ? new Date(initialData.date).toISOString().split("T")[0] : "",
    magazine_category: initialData?.category || "",
    MagCloudLink: initialData?.magCloudLink || "",
    magazine_slug: initialData?.slug || "",
    status: initialData ? initialData.status : 1, // Default to Published
  });

  const editorConfig = {
    readonly: false,
    placeholder: "Write magazine description...",
    minHeight: 300,
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateSlug = (title) => {
    return String(title || "")
      .toLowerCase()
      .replace(/'/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setValues((prev) => {
      const updated = { ...prev, magazine_title: title };
      // Only auto-generate slug if we are creating new magazine
      if (!initialData) {
        updated.magazine_slug = generateSlug(title);
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.magazine_title || !values.magazine_slug || !values.magazine_date) {
      toast.error("Please fill in the title, slug, and date.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("magazine_id", values.magazine_id);
    formData.append("magazine_title", values.magazine_title);
    formData.append("magazine_description", values.magazine_description);
    formData.append("magazine_tags", values.magazine_tags);
    formData.append("magazine_link", values.magazine_link);
    formData.append("magazine_date", values.magazine_date);
    formData.append("magazine_category", values.magazine_category);
    formData.append("MagCloudLink", values.MagCloudLink);
    formData.append("magazine_slug", values.magazine_slug);
    formData.append("status", values.status.toString());

    if (coverFileRef.current?.files[0]) {
      formData.append("magazine_cover_image", coverFileRef.current.files[0]);
    }

    try {
      const url = initialData
        ? `/api/dashboard/magazines/${initialData.slug}`
        : "/api/dashboard/magazines";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(initialData ? "Magazine updated successfully!" : "Magazine created successfully!");
        router.push("/dashboard/magazines");
        router.refresh();
      } else {
        toast.error(data.error || "Something went wrong!");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during save.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 text-slate-900 dark:text-slate-100">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/magazines"
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {initialData ? "Edit Magazine" : "Create New Magazine"}
          </h1>
          <p className="text-xs text-slate-500">
            {initialData ? "Modify magazine issue configurations." : "Publish a new magazine issue on your site."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Form inputs */}
        <div className="md:col-span-2 space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          {/* Identifiers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Magazine ID
              </label>
              <input
                type="text"
                value={values.magazine_id}
                onChange={(e) => setValues({ ...values, magazine_id: e.target.value })}
                placeholder="e.g. EBH-JULY-2026"
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 py-2.5 px-3 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Category
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={values.magazine_category}
                  onChange={(e) => setValues({ ...values, magazine_category: e.target.value })}
                  placeholder="e.g. Nature, Travel"
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 py-2.5 pl-8 pr-3 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <Layers className="absolute left-2.5 top-3 text-slate-400" size={14} />
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Magazine Title
            </label>
            <input
              type="text"
              value={values.magazine_title}
              onChange={handleTitleChange}
              placeholder="e.g. Exploring the Earth Issue #12"
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 py-2.5 px-3 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Slug (URL slug)
            </label>
            <input
              type="text"
              value={values.magazine_slug}
              onChange={(e) => setValues({ ...values, magazine_slug: e.target.value })}
              placeholder="e.g. exploring-the-earth-issue-12"
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 py-2.5 px-3 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Description / Introduction
            </label>
            <JoditEditor
              value={values.magazine_description}
              config={editorConfig}
              onBlur={(val) => setValues((prev) => ({ ...prev, magazine_description: val }))}
            />
          </div>
        </div>

        {/* Right Side: Media, links, status */}
        <div className="space-y-6">
          {/* Status and Action */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Status
              </label>
              <select
                value={values.status}
                onChange={(e) => setValues({ ...values, status: parseInt(e.target.value) })}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 py-2.5 px-3 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value={1}>Published</option>
                <option value={0}>Draft</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Issue"
              )}
            </button>
          </div>

          {/* Cover image */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cover Image
            </label>
            {coverPreview ? (
              <div className="relative aspect-[3/4] max-w-[200px] mx-auto rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm group">
                <img src={coverPreview} alt="Cover Preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setCoverPreview(null);
                    if (coverFileRef.current) coverFileRef.current.value = "";
                  }}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity cursor-pointer"
                >
                  Change Image
                </button>
              </div>
            ) : (
              <div
                onClick={() => coverFileRef.current?.click()}
                className="aspect-[3/4] max-w-[200px] mx-auto bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 gap-2 cursor-pointer transition"
              >
                <Upload size={24} />
                <span className="text-[10px] font-semibold">Upload Cover</span>
              </div>
            )}
            <input
              type="file"
              ref={coverFileRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Links and Metadata */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Publication Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={values.magazine_date}
                  onChange={(e) => setValues({ ...values, magazine_date: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 py-2.5 pl-8 pr-3 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
                <Calendar className="absolute left-2.5 top-3 text-slate-400" size={14} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                PDF / Read Link
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={values.magazine_link}
                  onChange={(e) => setValues({ ...values, magazine_link: e.target.value })}
                  placeholder="https://..."
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 py-2.5 pl-8 pr-3 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <LinkIcon className="absolute left-2.5 top-3 text-slate-400" size={14} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                MagCloud Link
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={values.MagCloudLink}
                  onChange={(e) => setValues({ ...values, MagCloudLink: e.target.value })}
                  placeholder="https://magcloud.com/..."
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 py-2.5 pl-8 pr-3 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <LinkIcon className="absolute left-2.5 top-3 text-slate-400" size={14} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Magazine Tags
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={values.magazine_tags}
                  onChange={(e) => setValues({ ...values, magazine_tags: e.target.value })}
                  placeholder="ecology, travel, nature"
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 py-2.5 pl-8 pr-3 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <Tag className="absolute left-2.5 top-3 text-slate-400" size={14} />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
