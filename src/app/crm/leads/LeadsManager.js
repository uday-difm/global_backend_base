"use client";

import { useState, useMemo } from "react";
import {
  Download, Edit2, Trash2, X, Search, Filter, Mail,
  ShieldCheck, Eye, MessageSquare, Save, AlertCircle, CheckCircle,
  RefreshCw, TestTube, ChevronDown
} from "lucide-react";

const SUBMISSION_STATUSES = ["new", "read", "spam", "archived"];
const LEAD_STATUSES = ["new", "contacted", "qualified", "closed"];

function StatusBadge({ status }) {
  const map = {
    new:       "bg-blue-50 text-blue-700 border-blue-200",
    read:      "bg-yellow-50 text-yellow-700 border-yellow-200",
    contacted: "bg-yellow-50 text-yellow-700 border-yellow-200",
    qualified: "bg-green-50 text-green-700 border-green-200",
    closed:    "bg-slate-100 text-slate-600 border-slate-200",
    spam:      "bg-red-50 text-red-700 border-red-200",
    archived:  "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border capitalize ${map[status] || "bg-gray-50 text-gray-500 border-gray-200"}`}>
      {status}
    </span>
  );
}

// ─── Submissions Tab ──────────────────────────────────────────────────────────
function SubmissionsTab({ siteId, submissions, setSubmissions }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      const matchStatus = filterStatus === "all" || s.status === filterStatus;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.message?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [submissions, search, filterStatus]);

  const openEdit = (sub) => {
    setSelected(sub);
    setNotes(sub.notes || "");
    setStatus(sub.status || "new");
    setError(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/forms/submissions/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-site-id": siteId },
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setSubmissions((prev) =>
        prev.map((s) => (s.id === selected.id ? { ...s, status, notes } : s))
      );
      setSelected(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this submission permanently?")) return;
    try {
      const res = await fetch(`/api/admin/forms/submissions/${id}`, {
        method: "DELETE",
        headers: { "x-site-id": siteId },
      });
      if (!res.ok) throw new Error("Delete failed");
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, message..."
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All statuses</option>
            {SUBMISSION_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <a
          href={`/api/admin/forms/export?siteId=${siteId}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Download size={13} /> Export CSV
        </a>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            {search || filterStatus !== "all" ? "No submissions match your filters." : "No submissions yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Message</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 text-sm">{sub.name}</div>
                      <div className="text-xs text-slate-500">{sub.email}</div>
                      {sub.phone && <div className="text-xs text-slate-400">{sub.phone}</div>}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="truncate text-slate-700 text-xs">{sub.message}</p>
                      {sub.notes && <p className="text-xs text-slate-400 italic mt-0.5 truncate">Note: {sub.notes}</p>}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={sub.status} /></td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(sub.createdAt).toLocaleDateString("en-US")}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => openEdit(sub)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg inline-flex transition-colors"
                        title="Edit status & notes"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg inline-flex transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
              <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Submission Details</h3>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 text-slate-400 hover:text-slate-900 rounded">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="text-xs text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">{error}</div>}

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex gap-2"><span className="font-semibold text-slate-600 w-16 shrink-0">Name:</span><span className="text-slate-900">{selected.name}</span></div>
                <div className="flex gap-2"><span className="font-semibold text-slate-600 w-16 shrink-0">Email:</span><span className="text-slate-900">{selected.email}</span></div>
                {selected.phone && <div className="flex gap-2"><span className="font-semibold text-slate-600 w-16 shrink-0">Phone:</span><span className="text-slate-900">{selected.phone}</span></div>}
                <div className="flex gap-2 mt-1"><span className="font-semibold text-slate-600 w-16 shrink-0">Date:</span><span className="text-slate-500">{new Date(selected.createdAt).toLocaleString("en-US")}</span></div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-600 block mb-1">Message:</span>
                  <p className="text-slate-800 whitespace-pre-wrap bg-white border rounded p-2.5 max-h-32 overflow-y-auto leading-relaxed">{selected.message}</p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    {SUBMISSION_STATUSES.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Add follow-up notes..."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setSelected(null)} className="px-4 py-2 text-xs border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="px-4 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 font-semibold transition-colors">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Leads Tab ────────────────────────────────────────────────────────────────
function LeadsTab({ siteId, leads, setLeads }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const matchStatus = filterStatus === "all" || l.status === filterStatus;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        l.name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.serviceInterest?.toLowerCase().includes(q) ||
        l.sourcePage?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [leads, search, filterStatus]);

  const openEdit = (lead) => {
    setSelected(lead);
    setNotes(lead.notes || "");
    setStatus(lead.status || "new");
    setError(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-site-id": siteId },
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setLeads((prev) =>
        prev.map((l) => (l.id === selected.id ? { ...l, status, notes } : l))
      );
      setSelected(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this lead permanently?")) return;
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: "DELETE",
        headers: { "x-site-id": siteId },
      });
      if (!res.ok) throw new Error("Delete failed");
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <a
          href={`/api/admin/leads/export?siteId=${siteId}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Download size={13} /> Export CSV
        </a>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            {search || filterStatus !== "all" ? "No leads match your filters." : "No leads yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Lead</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Interest / Source</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Created</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 text-sm">{lead.name}</div>
                      <div className="text-xs text-slate-500">{lead.email}</div>
                      {lead.phone && <div className="text-xs text-slate-400">{lead.phone}</div>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs text-slate-700 font-medium">{lead.serviceInterest || "N/A"}</div>
                      <div className="text-xs text-slate-400">{lead.sourcePage || "Direct"}</div>
                    </td>
                    <td className="px-5 py-3.5 max-w-[180px]">
                      <p className="text-xs text-slate-500 italic truncate">{lead.notes || "—"}</p>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={lead.status} /></td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleDateString("en-US")}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                      <button onClick={() => openEdit(lead)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg inline-flex transition-colors" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(lead.id)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg inline-flex transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Edit Lead</h3>
              <button onClick={() => setSelected(null)} className="p-1 text-slate-400 hover:text-slate-900 rounded"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="text-xs text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">{error}</div>}
              <div className="bg-slate-50 border rounded-lg p-4 text-xs space-y-1">
                <p><span className="font-semibold text-slate-600">Name:</span> <span className="text-slate-900">{selected.name}</span></p>
                <p><span className="font-semibold text-slate-600">Email:</span> <span className="text-slate-900">{selected.email}</span></p>
                {selected.phone && <p><span className="font-semibold text-slate-600">Phone:</span> <span className="text-slate-900">{selected.phone}</span></p>}
                {selected.serviceInterest && <p><span className="font-semibold text-slate-600">Interest:</span> <span className="text-slate-900">{selected.serviceInterest}</span></p>}
                {selected.sourcePage && <p><span className="font-semibold text-slate-600">Source:</span> <span className="text-slate-900">{selected.sourcePage}</span></p>}
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                    {LEAD_STATUSES.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Add follow-up notes, call logs..." />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setSelected(null)} className="px-4 py-2 text-xs border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 font-semibold">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



// ─── Spam Protection Tab ──────────────────────────────────────────────────────
function SpamTab({ siteId, initialConfig }) {
  const sc = initialConfig?.spamConfig || {};
  const [enabled, setEnabled] = useState(sc.spamFilterEnabled || false);
  const [keywords, setKeywords] = useState((sc.spamKeywords || ["spam", "casino", "viagra", "crypto"]).join(", "));
  const [honeypot, setHoneypot] = useState(sc.honeypotEnabled !== false);
  const [rateLimit, setRateLimit] = useState(sc.rateLimitEnabled !== false);
  const [rateLimitCount, setRateLimitCount] = useState(sc.rateLimitCount || 5);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    const keywordList = keywords.split(",").map((k) => k.trim()).filter(Boolean);
    try {
      const res = await fetch(`/api/admin/forms/config?siteId=${siteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-site-id": siteId },
        body: JSON.stringify({
          spamConfig: {
            spamFilterEnabled: enabled,
            spamKeywords: keywordList,
            honeypotEnabled: honeypot,
            rateLimitEnabled: rateLimit,
            rateLimitCount: Number(rateLimitCount),
          },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setMsg({ type: "success", text: "Spam protection settings saved." });
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-semibold ${msg.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {msg.type === "success" ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
          {msg.text}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Spam Protection Settings</h3>

        {/* Honeypot */}
        <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100">
          <div>
            <p className="text-sm font-semibold text-slate-800">Honeypot Field</p>
            <p className="text-xs text-slate-500 mt-0.5">Hidden field that bots fill but real users don&apos;t. Silently blocks bot submissions.</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer shrink-0">
            <input type="checkbox" checked={honeypot} onChange={(e) => setHoneypot(e.target.checked)} className="rounded border-slate-300 text-green-600 h-4 w-4" />
            <span className="text-xs font-semibold text-slate-700">{honeypot ? "Active" : "Inactive"}</span>
          </label>
        </div>

        {/* Rate Limiting */}
        <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100">
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">Rate Limiting</p>
            <p className="text-xs text-slate-500 mt-0.5">Block submissions from the same email exceeding a limit per hour.</p>
            {rateLimit && (
              <div className="flex items-center gap-2 mt-2">
                <label className="text-xs text-slate-600 font-semibold shrink-0">Max per hour:</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={rateLimitCount}
                  onChange={(e) => setRateLimitCount(e.target.value)}
                  className="w-16 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer shrink-0">
            <input type="checkbox" checked={rateLimit} onChange={(e) => setRateLimit(e.target.checked)} className="rounded border-slate-300 text-green-600 h-4 w-4" />
            <span className="text-xs font-semibold text-slate-700">{rateLimit ? "Active" : "Inactive"}</span>
          </label>
        </div>

        {/* Keyword filter */}
        <div className="py-3">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Keyword Spam Filter</p>
              <p className="text-xs text-slate-500 mt-0.5">Block submissions containing specific words in the name, email or message.</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer shrink-0">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="rounded border-slate-300 text-green-600 h-4 w-4" />
              <span className="text-xs font-semibold text-slate-700">{enabled ? "Active" : "Inactive"}</span>
            </label>
          </div>
          {enabled && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blocked Keywords <span className="text-slate-400 font-normal">(comma-separated)</span></label>
              <textarea
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                rows={3}
                placeholder="spam, casino, viagra, crypto, buy now"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-700 disabled:bg-slate-300 transition-colors shadow-sm">
        <Save size={14} /> {saving ? "Saving..." : "Save Spam Settings"}
      </button>
    </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────
const TABS = [
  { key: "submissions", label: "Contact Submissions", icon: MessageSquare },
  { key: "leads",       label: "Leads CRM",           icon: Filter },
  { key: "spam",        label: "Spam Protection",      icon: ShieldCheck },
];

export default function LeadsManager({ siteId, initialSubmissions, initialLeads, initialConfig }) {
  const [activeTab, setActiveTab] = useState("submissions");
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [leads, setLeads] = useState(initialLeads);

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900">Leads & Contact Forms</h1>
        <p className="text-xs text-slate-500 mt-1">Manage form submissions, leads pipeline, email settings and spam protection.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            <Icon size={13} />
            {label}
            {key === "submissions" && (
              <span className="ml-1 bg-slate-100 text-slate-600 border border-slate-200 text-2xs font-bold px-1.5 py-0.5 rounded-full">
                {submissions.length}
              </span>
            )}
            {key === "leads" && (
              <span className="ml-1 bg-slate-100 text-slate-600 border border-slate-200 text-2xs font-bold px-1.5 py-0.5 rounded-full">
                {leads.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === "submissions" && (
        <SubmissionsTab siteId={siteId} submissions={submissions} setSubmissions={setSubmissions} />
      )}
      {activeTab === "leads" && (
        <LeadsTab siteId={siteId} leads={leads} setLeads={setLeads} />
      )}
      {activeTab === "spam" && (
        <SpamTab siteId={siteId} initialConfig={initialConfig} />
      )}
    </div>
  );
}
