"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Code, CheckSquare, Square, AlertTriangle } from "lucide-react";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newTemplate, setNewTemplate] = useState({ name: "", subject: "", htmlContent: "" });
  const [siteId, setSiteId] = useState("");
  const [saveError, setSaveError] = useState(null);

  // Bulk select state
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("x-site-id") || process.env.NEXT_PUBLIC_SITE_ID || "";
    setSiteId(id);
  }, []);

  useEffect(() => {
    if (siteId) fetchTemplates();
  }, [siteId]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/templates", { headers: { "x-site-id": siteId } });
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data?.templates || []);
        setSelected(new Set());
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError(null);
    if (!siteId) return setSaveError("Site ID not loaded yet. Please wait.");
    try {
      const url = editingId ? `/api/crm/templates/${editingId}` : "/api/crm/templates";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-site-id": siteId },
        body: JSON.stringify(newTemplate)
      });
      const data = await res.json();
      if (data.success) {
        setNewTemplate({ name: "", subject: "", htmlContent: "" });
        setEditingId(null);
        setShowAddForm(false);
        fetchTemplates();
      } else {
        setSaveError(data.error || "Failed to save template.");
      }
    } catch (err) {
      setSaveError("Network error: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this template?")) return;
    try {
      await fetch(`/api/crm/templates/${id}`, { method: "DELETE", headers: { "x-site-id": siteId } });
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (tpl) => {
    setEditingId(tpl.id);
    setNewTemplate({ name: tpl.name, subject: tpl.subject || "", htmlContent: tpl.htmlContent });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Bulk select helpers
  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === templates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(templates.map(t => t.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected template(s)? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(
        [...selected].map(id =>
          fetch(`/api/crm/templates/${id}`, { method: "DELETE", headers: { "x-site-id": siteId } })
        )
      );
      await fetchTemplates();
    } catch (err) {
      console.error(err);
    }
    setBulkDeleting(false);
  };

  const handleApplyPreset = (presetName) => {
    let presetHtml = "";
    if (presetName === "newsletter") {
      presetHtml = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
    .header { background: #4f46e5; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 20px; }
    .footer { font-size: 11px; text-align: center; color: #999; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h2>Weekly Insights</h2></div>
    <div class="content">
      <p>Hello Subscriber,</p>
      <p>Welcome to our weekly newsletter!</p>
      <p>Best regards,<br/>The Editorial Team</p>
    </div>
    <div class="footer">You are receiving this because you subscribed. <a href="#">Unsubscribe</a></div>
  </div>
</body>
</html>`;
    } else if (presetName === "promotion") {
      presetHtml = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 20px; }
    .card { background: #fff; max-width: 500px; margin: 0 auto; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; }
    .banner { background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; text-align: center; padding: 40px 20px; }
    .body { padding: 30px; text-align: center; }
    .btn { display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 9999px; font-weight: bold; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="banner"><h1 style="margin:0;font-size:28px;">Special Promotion!</h1></div>
    <div class="body">
      <p>Get exclusive access for 50% off this month only.</p>
      <a href="#" class="btn">Get Discount Now</a>
    </div>
  </div>
</body>
</html>`;
    }
    setNewTemplate({ ...newTemplate, htmlContent: presetHtml });
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Email Layout Templates</h1>
          <p className="text-slate-500 text-xs mt-1">Store pre-built HTML newsletter structures to apply instantly to campaigns</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setNewTemplate({ name: "", subject: "", htmlContent: "" }); setShowAddForm(!showAddForm); }}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus size={14} /> New Template
        </button>
      </div>

      {/* Add / Edit Form */}
      {showAddForm && (
        <form onSubmit={handleSave} className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4">
          <h3 className="text-sm font-bold">{editingId ? "Edit Template" : "Compose Layout Template"}</h3>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Template Name" required value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              className="p-2 border rounded text-xs dark:bg-slate-900 w-full" />
            <input type="text" placeholder="Default Subject Line (optional)" value={newTemplate.subject}
              onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
              className="p-2 border rounded text-xs dark:bg-slate-900 w-full" />
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Presets:</span>
            <button type="button" onClick={() => handleApplyPreset("newsletter")} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-[10px] hover:bg-slate-200">Weekly Newsletter</button>
            <button type="button" onClick={() => handleApplyPreset("promotion")} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-[10px] hover:bg-slate-200">Promo Event Card</button>
          </div>
          <textarea placeholder="Template HTML Markup" rows={12} required value={newTemplate.htmlContent}
            onChange={(e) => setNewTemplate({ ...newTemplate, htmlContent: e.target.value })}
            className="p-2 border rounded text-xs dark:bg-slate-900 w-full font-mono" />
          <div className="flex gap-2 items-center">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 transition">Save Template</button>
            <button type="button" onClick={() => { setShowAddForm(false); setSaveError(null); }} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded text-xs font-semibold">Cancel</button>
            {saveError && <p className="text-red-500 text-xs font-semibold">{saveError}</p>}
          </div>
        </form>
      )}

      {/* Bulk Actions Bar — shown when templates exist */}
      {!loading && templates.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-semibold transition"
          >
            {selected.size === templates.length
              ? <CheckSquare size={14} className="text-indigo-600" />
              : <Square size={14} />}
            {selected.size === templates.length ? "Deselect All" : "Select All"}
          </button>
          <span className="text-xs text-slate-400">{selected.size > 0 ? `${selected.size} selected` : `${templates.length} total`}</span>
          {selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition disabled:opacity-60"
            >
              <Trash2 size={12} />
              {bulkDeleting ? "Deleting..." : `Delete ${selected.size} Selected`}
            </button>
          )}
          {templates.length > 1 && selected.size === 0 && (
            <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
              <AlertTriangle size={11} /> Select templates to bulk-delete duplicates
            </span>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 col-span-full">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 col-span-full">No layout templates configured. Click "New Template" to save one.</div>
        ) : (
          templates.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => toggleSelect(tpl.id)}
              className={`p-4 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl flex flex-col justify-between hover:shadow-sm transition cursor-pointer ${selected.has(tpl.id) ? "ring-2 ring-indigo-500 border-indigo-400" : ""}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {selected.has(tpl.id)
                      ? <CheckSquare size={13} className="text-indigo-600 flex-shrink-0" />
                      : <Square size={13} className="text-slate-300 flex-shrink-0" />}
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{tpl.name}</h3>
                  </div>
                  <div className="flex p-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded">
                    <Code size={12} />
                  </div>
                </div>
                {tpl.subject && <p className="text-[10px] text-slate-400 mb-2">Subject: "{tpl.subject}"</p>}
                <div className="p-2 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded text-[9px] text-slate-400 font-mono line-clamp-4 h-16 overflow-hidden">
                  {tpl.htmlContent}
                </div>
              </div>
              <div className="flex gap-1 justify-end items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(tpl); }}
                  className="p-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition"
                  title="Edit"
                >
                  <Edit2 size={11} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(tpl.id); }}
                  className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                  title="Delete"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
