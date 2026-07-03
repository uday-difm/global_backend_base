"use client";

import { useState, useCallback } from "react";
import {
  Search,
  ExternalLink,
  Edit3,
  X,
  Check,
  AlertCircle,
  Globe,
  FileText,
  Image as ImageIcon,
  Link,
  Code,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
} from "lucide-react";

function getSeoStatus(item) {
  let score = 0;
  if (item.seoTitle) score++;
  if (item.seoDescription) score++;
  if (item.ogImage) score++;
  if (item.canonicalUrl) score++;
  if (score === 0) return { label: "Not Set", color: "text-gray-400 dark:text-slate-400", bg: "bg-gray-100 dark:bg-slate-700" };
  if (score <= 2) return { label: "Partial", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" };
  return { label: "Complete", color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/30" };
}

function SeoStatusBadge({ item }) {
  const status = getSeoStatus(item);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${status.color} ${status.bg}`}>
      {status.label}
    </span>
  );
}

export default function SeoDashboardClient({ siteId, initialPages, initialPosts }) {
  const [activeTab, setActiveTab] = useState("pages");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Form state
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [jsonLd, setJsonLd] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [pages, setPages] = useState(initialPages);
  const [posts, setPosts] = useState(initialPosts);

  // Auditor review states
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewResults, setReviewResults] = useState(null);
  const [reviewError, setReviewError] = useState(null);

  const runTechnicalReview = async () => {
    setReviewLoading(true);
    setReviewError(null);
    try {
      const res = await fetch("/api/admin/seo/review", {
        method: "POST",
        headers: { "x-site-id": siteId },
      });
      const data = await res.json();
      if (res.ok) {
        setReviewResults(data.data || data);
      } else {
        throw new Error(data.error || "Failed to execute technical auditor scan");
      }
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  const items = activeTab === "pages" ? pages : posts;
  const filtered = items.filter(
    (item) =>
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.slug?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setSeoTitle(item.seoTitle || "");
    setSeoDescription(item.seoDescription || "");
    setCanonicalUrl(item.canonicalUrl || "");
    setOgImage(item.ogImage || "");
    setJsonLd(item.jsonLd ? JSON.stringify(item.jsonLd, null, 2) : "");
    setError(null);
    setSuccess(null);
    setIsEditorOpen(true);
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setSelectedItem(null);
  };

  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    let parsedJsonLd = null;
    if (jsonLd.trim()) {
      try {
        parsedJsonLd = JSON.parse(jsonLd);
      } catch {
        setError("Invalid JSON-LD: Please check your JSON syntax.");
        setIsSubmitting(false);
        return;
      }
    }

    const slug = selectedItem.slug.startsWith("/") ? selectedItem.slug : `/${selectedItem.slug}`;

    try {
      const res = await fetch(`/api/admin/seo/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-site-id": siteId,
        },
        body: JSON.stringify({
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          canonicalUrl: canonicalUrl || null,
          ogImage: ogImage || null,
          jsonLd: parsedJsonLd,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save SEO data");
      }

      const result = await res.json();
      const updated = result.page || result.post;

      // Update local state
      const updater = (prev) =>
        prev.map((p) => (p.id === selectedItem.id ? { ...p, ...updated } : p));

      if (result.type === "post") {
        setPosts(updater);
      } else {
        setPages(updater);
      }

      setSelectedItem((prev) => ({ ...prev, ...updated }));
      setSuccess("SEO data saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedItem, seoTitle, seoDescription, canonicalUrl, ogImage, jsonLd, siteId]);

  const jsonPreview = (item) => {
    const title = item.seoTitle || item.title;
    const desc = item.seoDescription || "";
    return (
      <div className="border-l-2 border-blue-400 dark:border-indigo-500 pl-3 py-1 space-y-0.5">
        <p className="text-xs text-blue-700 dark:text-indigo-400 font-medium truncate">https://example.com{item.slug}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-slate-200 truncate">{title}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">{desc || "No description set"}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-150 dark:bg-slate-800 rounded-xl p-1 border border-gray-200/50 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("pages")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === "pages"
                ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
            }`}
          >
            <FileText size={15} />
            Pages ({pages.length})
          </button>
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === "posts"
                ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
            }`}
          >
            <FileText size={15} />
            Blog Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab("review")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === "review"
                ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
            }`}
          >
            <Globe size={15} />
            Technical Review
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-850 shadow-sm max-w-xs w-full text-slate-800 dark:text-slate-200">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            className="flex-1 text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500 bg-transparent text-slate-800 dark:text-slate-200"
            placeholder="Search by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content list */}
      <div className="space-y-3">
        {activeTab === "review" ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b dark:border-slate-750 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base">Website Technical Auditor</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Scan speed parameters, broken links, image accessibility compliance, and SEO configurations.</p>
              </div>
              <button
                onClick={runTechnicalReview}
                disabled={reviewLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
              >
                <RefreshCw size={14} className={reviewLoading ? "animate-spin" : ""} />
                {reviewLoading ? "Reviewing..." : "Run Technical Audit"}
              </button>
            </div>

            {reviewError && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-xl text-sm">
                {reviewError}
              </div>
            )}

            {reviewLoading && !reviewResults && (
              <div className="py-16 text-center space-y-3">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full" />
                <p className="text-sm text-gray-500 font-medium">Scanning client-side page configurations, testing media tags, and verifying slug mapping...</p>
              </div>
            )}

            {reviewResults ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 border dark:border-slate-750 rounded-xl bg-white dark:bg-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Overall SEO Score</span>
                    <div className="text-2xl font-extrabold text-blue-600">{reviewResults.overallSeoScore}%</div>
                  </div>
                  <div className="p-4 border dark:border-slate-750 rounded-xl bg-white dark:bg-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Performance Speed</span>
                    <div className="text-2xl font-extrabold text-emerald-600">{reviewResults.performance?.speedScore}%</div>
                  </div>
                  <div className="p-4 border dark:border-slate-750 rounded-xl bg-white dark:bg-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Broken Links</span>
                    <div className="text-2xl font-extrabold text-red-600">{reviewResults.brokenLinks?.count} Detected</div>
                  </div>
                  <div className="p-4 border dark:border-slate-750 rounded-xl bg-white dark:bg-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Accessibility Score</span>
                    <div className="text-2xl font-extrabold text-purple-600">{reviewResults.accessibility?.score}%</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Broken Links & Accessibility */}
                  <div className="space-y-4">
                    <div className="border dark:border-slate-750 rounded-xl p-5 bg-white dark:bg-slate-800 space-y-3">
                      <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 border-b dark:border-slate-750 pb-2">Broken Links Report</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {reviewResults.brokenLinks?.links?.map((link, idx) => (
                          <div key={idx} className="p-3 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/35 rounded-lg text-xs space-y-1">
                            <div className="font-semibold text-red-700 dark:text-red-400">Broken Link: "{link.targetUrl}"</div>
                            <div className="text-gray-500 dark:text-slate-400">Found on page: <span className="font-semibold">{link.pageTitle}</span></div>
                          </div>
                        ))}
                        {reviewResults.brokenLinks?.count === 0 && (
                          <div className="text-center text-xs text-gray-400 italic py-6">All links mapped successfully. No broken paths detected.</div>
                        )}
                      </div>
                    </div>

                    <div className="border dark:border-slate-750 rounded-xl p-5 bg-white dark:bg-slate-800 space-y-3">
                      <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 border-b dark:border-slate-750 pb-2">Accessibility Checklist</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {reviewResults.accessibility?.issues?.map((issue, idx) => (
                          <div key={idx} className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/35 rounded-lg text-xs space-y-1">
                            <div className="font-semibold text-amber-700 dark:text-amber-400">{issue.issue}</div>
                            <div className="text-[10px] text-gray-500 dark:text-slate-400 font-mono truncate">Asset: {issue.fileName}</div>
                          </div>
                        ))}
                        {reviewResults.accessibility?.issues?.length === 0 && (
                          <div className="text-center text-xs text-gray-400 italic py-6">All media assets compliant with image alt-text standards.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: SEO Status Check */}
                  <div className="border dark:border-slate-750 rounded-xl p-5 bg-white dark:bg-slate-800 space-y-3">
                    <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 border-b dark:border-slate-750 pb-2">Page-by-Page SEO Audits</h4>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {reviewResults.seoScan?.map((scan) => (
                        <div key={scan.id} className="p-3.5 border dark:border-slate-750 rounded-lg space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-900 dark:text-slate-100 text-xs">{scan.title}</span>
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                              scan.score >= 80 ? "bg-green-50 text-green-700" : (scan.score >= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")
                            }`}>
                              SEO: {scan.score}%
                            </span>
                          </div>
                          {scan.issues.length > 0 ? (
                            <ul className="list-disc pl-4 text-[10px] text-gray-500 dark:text-slate-400 space-y-0.5">
                              {scan.issues.map((issue, idx) => <li key={idx}>{issue}</li>)}
                            </ul>
                          ) : (
                            <div className="text-[10px] text-green-600 font-semibold">Perfect Optimization</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              !reviewLoading && (
                <div className="py-12 text-center text-xs text-gray-400 italic">
                  Press "Run Technical Audit" to start the review scanner.
                </div>
              )
            )}
          </div>
        ) : (
          filtered.length === 0 ? (
            <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center text-gray-500 dark:text-slate-400 shadow-sm">
              No {activeTab} found with the current filter.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center gap-4"
              >
                {/* SEO Preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm truncate">{item.title}</h3>
                    <SeoStatusBadge item={item} />
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                      item.status === "PUBLISHED"
                        ? "text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400"
                        : "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400"
                    }`}>
                      {item.status === "PUBLISHED" ? "Published" : "Draft"}
                    </span>
                  </div>
                  {jsonPreview(item)}
                </div>

                {/* SEO field icons */}
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-slate-400 shrink-0">
                  <span className={`flex items-center gap-1 ${item.seoTitle ? "text-green-500 dark:text-green-400" : ""}`} title="SEO Title">
                    <Globe size={12} /> Title
                  </span>
                  <span className={`flex items-center gap-1 ${item.seoDescription ? "text-green-500 dark:text-green-400" : ""}`} title="SEO Description">
                    <Eye size={12} /> Desc
                  </span>
                  <span className={`flex items-center gap-1 ${item.ogImage ? "text-green-500 dark:text-green-400" : ""}`} title="OG Image">
                    <ImageIcon size={12} /> OG
                  </span>
                  <span className={`flex items-center gap-1 ${item.canonicalUrl ? "text-green-500 dark:text-green-400" : ""}`} title="Canonical URL">
                    <Link size={12} /> Canonical
                  </span>
                  <span className={`flex items-center gap-1 ${item.jsonLd ? "text-green-500 dark:text-green-400" : ""}`} title="JSON-LD">
                    <Code size={12} /> JSON-LD
                  </span>
                </div>

                {/* Edit button */}
                <button
                  onClick={() => handleEditClick(item)}
                  className="flex items-center gap-1.5 shrink-0 px-3.5 py-2 border border-gray-200 dark:border-slate-750 rounded-lg text-xs font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                >
                  <Edit3 size={13} />
                  Edit SEO
                </button>
              </div>
            ))
          )
        )}
      </div>

      {/* SEO Editor Modal */}
      {isEditorOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto text-slate-800 dark:text-slate-200">
            <div className="flex items-center justify-between border-b border-gray-150 dark:border-slate-700 pb-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Edit SEO: {selectedItem.title}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 font-mono mt-0.5">{selectedItem.slug}</p>
              </div>
              <button
                onClick={handleEditorClose}
                className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/40 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm rounded-lg border border-green-100 dark:border-green-900/40 flex items-start gap-2">
                <Check size={15} className="shrink-0 mt-0.5" />
                {success}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 outline-none focus:border-blue-600 dark:focus:border-indigo-500 text-sm text-slate-800 dark:text-slate-100"
                    placeholder="e.g. About Us | My Company"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    {seoTitle.length} / 60 chars recommended
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    SEO Description
                  </label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 outline-none focus:border-blue-600 dark:focus:border-indigo-500 text-sm text-slate-800 dark:text-slate-100"
                    placeholder="e.g. Learn more about our company mission and values..."
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    {seoDescription.length} / 160 chars recommended
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Canonical URL
                  </label>
                  <input
                    type="url"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 outline-none focus:border-blue-600 dark:focus:border-indigo-500 text-sm text-slate-800 dark:text-slate-100"
                    placeholder="https://example.com/page"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    OG Image URL
                  </label>
                  <input
                    type="url"
                    value={ogImage}
                    onChange={(e) => setOgImage(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 outline-none focus:border-blue-600 dark:focus:border-indigo-500 text-sm text-slate-800 dark:text-slate-100"
                    placeholder="https://example.com/og-image.jpg"
                  />
                  {ogImage && (
                    <img
                      src={ogImage}
                      alt="OG Preview"
                      className="mt-2 h-16 w-28 rounded-lg object-cover border border-gray-200 dark:border-slate-750"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    JSON-LD Structured Data
                  </label>
                  <textarea
                    value={jsonLd}
                    onChange={(e) => setJsonLd(e.target.value)}
                    rows={6}
                    className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 outline-none focus:border-blue-600 dark:focus:border-indigo-500 text-sm text-slate-800 dark:text-slate-100 font-mono"
                    placeholder='{"@context": "https://schema.org", ...}'
                  />
                </div>
              </div>

              {/* Google Preview */}
              <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
                <h4 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Search Result Preview</h4>
                <div className="space-y-0.5">
                  <p className="text-xs text-green-800 dark:text-green-400">https://example.com{selectedItem.slug}</p>
                  <p className="text-sm font-semibold text-blue-800 dark:text-indigo-400 truncate">
                    {seoTitle || selectedItem.title || "Page Title"}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-slate-300 line-clamp-2">
                    {seoDescription || "No description set."}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-150 dark:border-slate-700 pt-4">
                <button
                  type="button"
                  onClick={handleEditorClose}
                  className="px-4 py-2 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 dark:bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 dark:hover:bg-indigo-700 disabled:bg-blue-300 dark:disabled:bg-indigo-850 transition"
                >
                  {isSubmitting ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  {isSubmitting ? "Saving..." : "Save SEO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

