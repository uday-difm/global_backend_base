"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Save, Eye } from "lucide-react";
import { toast } from "sonner";

export default function NewMagazinePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);

  const [form, setForm] = useState({
    magazine_id: "",
    magazine_title: "",
    magazine_slug: "",
    magazine_description: "",
    magazine_tags: "",
    magazine_category: "",
    magazine_link: "",
    MagCloudLink: "",
    magazine_date: new Date().toISOString().split("T")[0],
    status: "1",
  });
  const [coverFile, setCoverFile] = useState(null);

  const slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-") // Replace spaces with -
      .replace(/[^\w\-]+/g, "") // Remove all non-word chars
      .replace(/\-\-+/g, "-"); // Replace multiple - with single -
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setForm((prev) => ({
      ...prev,
      magazine_title: title,
      magazine_slug: slugify(title),
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.magazine_title || !form.magazine_slug || !form.magazine_date) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("magazine_id", form.magazine_id);
    formData.append("magazine_title", form.magazine_title);
    formData.append("magazine_slug", form.magazine_slug);
    formData.append("magazine_description", form.magazine_description);
    formData.append("magazine_tags", form.magazine_tags);
    formData.append("magazine_category", form.magazine_category);
    formData.append("magazine_link", form.magazine_link);
    formData.append("MagCloudLink", form.MagCloudLink);
    formData.append("magazine_date", form.magazine_date);
    formData.append("status", form.status);
    if (coverFile) {
      formData.append("magazine_cover_image", coverFile);
    }

    try {
      const res = await fetch("/api/dashboard/magazines", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Magazine issue created successfully!");
        router.push("/dashboard/magazines");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to create magazine issue");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error creating magazine issue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/magazines"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">New Magazine Issue</h1>
            <p className="text-xs text-slate-500">Publish a new issue of your digital or physical print magazine.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Form Details */}
        <div className="md:col-span-2 space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Issue Title *</label>
            <input
              type="text"
              required
              value={form.magazine_title}
              onChange={handleTitleChange}
              placeholder="e.g. Summer Edition 2026"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Slug *</label>
              <input
                type="text"
                required
                value={form.magazine_slug}
                onChange={(e) => setForm({ ...form, magazine_slug: slugify(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Custom Issue ID</label>
              <input
                type="text"
                value={form.magazine_id}
                onChange={(e) => setForm({ ...form, magazine_id: e.target.value })}
                placeholder="e.g. ISSUE-04"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</label>
            <textarea
              value={form.magazine_description}
              onChange={(e) => setForm({ ...form, magazine_description: e.target.value })}
              placeholder="Provide a brief summary of the issue content..."
              rows={4}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</label>
              <input
                type="text"
                value={form.magazine_category}
                onChange={(e) => setForm({ ...form, magazine_category: e.target.value })}
                placeholder="e.g. Tech, Lifestyle"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tags (Comma-separated)</label>
              <input
                type="text"
                value={form.magazine_tags}
                onChange={(e) => setForm({ ...form, magazine_tags: e.target.value })}
                placeholder="e.g. design, future, business"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Digital Magazine URL (PDF/Flipbook)</label>
              <input
                type="url"
                value={form.magazine_link}
                onChange={(e) => setForm({ ...form, magazine_link: e.target.value })}
                placeholder="https://..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">MagCloud Print Purchase URL</label>
              <input
                type="url"
                value={form.MagCloudLink}
                onChange={(e) => setForm({ ...form, MagCloudLink: e.target.value })}
                placeholder="https://www.magcloud.com/..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Image and Publish Options */}
        <div className="space-y-6">
          {/* Image Upload Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cover Image</label>
            <div className="aspect-[3/4] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl relative flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden">
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                  <label className="absolute bottom-3 left-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-lg py-2 text-center text-[10px] font-bold transition cursor-pointer">
                    Change Cover
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                </>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer">
                  <Upload size={24} className="text-slate-400 mb-2" />
                  <span className="text-[11px] font-bold text-slate-500">Upload Cover Image</span>
                  <span className="text-[9px] text-slate-400 mt-1">PNG, JPG or WEBP (Recommended 3:4 ratio)</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>

          {/* Issue Settings */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Publication Date *</label>
              <input
                type="date"
                required
                value={form.magazine_date}
                onChange={(e) => setForm({ ...form, magazine_date: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Publishing Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors"
              >
                <option value="1">Active / Published</option>
                <option value="0">Inactive / Draft</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg py-2.5 text-xs font-bold transition cursor-pointer"
            >
              <Save size={14} />
              {submitting ? "Publishing..." : "Create Issue"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
