"use client";

import { useState, useEffect } from "react";
import { Megaphone, Mail, Play, Trash2, Plus, RefreshCw, Send } from "lucide-react";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [lists, setLists] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    subject: "",
    body: "",
    listId: "",
  });
  const [testEmail, setTestEmail] = useState("");
  const [activeTestId, setActiveTestId] = useState(null);
  const [siteId, setSiteId] = useState("");
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem("x-site-id") || process.env.NEXT_PUBLIC_SITE_ID || "";
    setSiteId(id);
  }, []);

  useEffect(() => {
    if (siteId) {
      fetchCampaigns();
      fetchLists();
      fetchTemplates();
    }
  }, [siteId]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/campaigns", {
        headers: { "x-site-id": siteId }
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.success) {
          setCampaigns(data.data?.campaigns || []);
        }
      }
    } catch (err) {
      console.error("fetchCampaigns failed:", err);
    }
    setLoading(false);
  };

  const fetchLists = async () => {
    try {
      const res = await fetch("/api/crm/lists", {
        headers: { "x-site-id": siteId }
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.success) {
          setLists(data.data?.lists || []);
        }
      }
    } catch (err) {
      console.error("fetchLists failed:", err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/crm/templates", {
        headers: { "x-site-id": siteId }
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.success) {
          setTemplates(data.data?.templates || []);
        }
      }
    } catch (err) {
      console.error("fetchTemplates failed:", err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaveError(null);
    if (!siteId) return setSaveError("Site ID not loaded yet, please wait.");

    try {
      const res = await fetch("/api/crm/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-site-id": siteId
        },
        body: JSON.stringify(newCampaign)
      });
      const data = await res.json();
      if (data.success) {
        setNewCampaign({ name: "", subject: "", body: "", listId: "" });
        setShowAddForm(false);
        fetchCampaigns();
      } else {
        setSaveError(data.error || "Failed to save campaign.");
      }
    } catch (err) {
      console.error(err);
      setSaveError("Network error: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      const res = await fetch(`/api/crm/campaigns/${id}`, {
        method: "DELETE",
        headers: { "x-site-id": siteId }
      });
      const data = await res.json();
      if (data.success) {
        fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (id) => {
    if (!confirm("Are you sure you want to trigger sending this campaign? This will email all active list subscribers.")) return;
    alert("Campaign dispatch triggered! Processing emails...");
    try {
      const res = await fetch(`/api/crm/campaigns/${id}/send`, {
        method: "POST",
        headers: { "x-site-id": siteId }
      });
      const data = await res.json();
      if (data.success) {
        alert(`Finished: Sent ${data.data.sentCount} emails, ${data.data.failedCount} failures.`);
        fetchCampaigns();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendTest = async (id) => {
    if (!testEmail) return alert("Please enter a target email first");
    try {
      const res = await fetch(`/api/crm/campaigns/${id}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-site-id": siteId
        },
        body: JSON.stringify({ email: testEmail })
      });
      const data = await res.json();
      if (data.success) {
        alert("Test email dispatched successfully!");
        setTestEmail("");
        setActiveTestId(null);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyTemplate = (templateHtml) => {
    setNewCampaign({ ...newCampaign, body: templateHtml });
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Email Campaigns
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Create, schedule, and broadcast custom newsletters
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus size={14} /> New Campaign
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreate} className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4">
          <h3 className="text-sm font-bold">Compose Campaign</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Campaign Name (internal)"
              required
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              className="p-2 border rounded text-xs dark:bg-slate-900 w-full"
            />
            <input
              type="text"
              placeholder="Email Subject line"
              required
              value={newCampaign.subject}
              onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
              className="p-2 border rounded text-xs dark:bg-slate-900 w-full"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 items-center">
            <div className="col-span-2">
              {lists.length === 0 ? (
                <div className="p-2 border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-400">
                  ⚠️ No subscriber lists yet.{" "}
                  <a href="/crm/lists" className="underline font-semibold">Create a list first</a>{" "}to target a campaign. You can still save as a draft.
                </div>
              ) : (
                <select
                  value={newCampaign.listId}
                  onChange={(e) => setNewCampaign({ ...newCampaign, listId: e.target.value })}
                  className="p-2 border rounded text-xs dark:bg-slate-900 w-full"
                >
                  <option value="">Select Target Subscriber List (optional for draft)...</option>
                  {lists.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l._count?.subscribers || 0} subscribers)</option>
                  ))}
                </select>
              )}
            </div>
            {templates.length > 0 && (
              <div>
                <select
                  onChange={(e) => handleApplyTemplate(e.target.value)}
                  className="p-2 border rounded text-xs bg-slate-50 dark:bg-slate-900 w-full"
                  defaultValue=""
                >
                  <option value="" disabled>Apply Template Layout...</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.htmlContent}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <textarea
            placeholder="Email Body (supports HTML)"
            rows={8}
            required
            value={newCampaign.body}
            onChange={(e) => setNewCampaign({ ...newCampaign, body: e.target.value })}
            className="p-2 border rounded text-xs dark:bg-slate-900 w-full font-mono"
          />

          <div className="flex items-center gap-3">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 transition">
              Save Draft Campaign
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setSaveError(null); }}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded text-xs font-semibold"
            >
              Cancel
            </button>
            {saveError && <p className="text-red-500 text-xs font-semibold">{saveError}</p>}
          </div>
        </form>
      )}

      {/* Campaigns list table */}
      <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No campaigns generated yet. Click "New Campaign" to draft one.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="p-3">Campaign</th>
                <th className="p-3">Subject</th>
                <th className="p-3">Target List</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created At</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
              {campaigns.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                  <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{item.name}</td>
                  <td className="p-3 text-slate-500 italic">"{item.subject}"</td>
                  <td className="p-3 text-slate-600">{item.list?.name || "-"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      item.status === "sent"
                        ? "bg-green-50 text-green-700 border-green-150"
                        : item.status === "sending"
                        ? "bg-blue-50 text-blue-700 border-blue-150"
                        : "bg-slate-50 text-slate-700 border-slate-150"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 text-[10px]">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right space-y-1">
                    <div className="flex gap-1 justify-end items-center">
                      {item.status === "draft" && (
                        <button
                          onClick={() => handleSend(item.id)}
                          title="Execute dispatch"
                          className="p-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition"
                        >
                          <Send size={11} />
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setActiveTestId(activeTestId === item.id ? null : item.id);
                        }}
                        title="Send Test Email"
                        className="p-1 bg-amber-50 text-amber-600 rounded hover:bg-amber-100 transition"
                      >
                        <Mail size={11} />
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>

                    {activeTestId === item.id && (
                      <div className="flex gap-1 mt-1 justify-end items-center">
                        <input
                          type="email"
                          placeholder="Test Email"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          className="p-1 border rounded text-[10px] w-28 dark:bg-slate-900"
                        />
                        <button
                          onClick={() => handleSendTest(item.id)}
                          className="px-2 py-1 bg-slate-800 text-white rounded text-[10px] font-bold"
                        >
                          Send
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
