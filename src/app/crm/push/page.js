"use client";

import { Bell, Trash2, Plus, Send, Play, Settings } from "lucide-react";
import { useState, useEffect } from "react";

export default function PushPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [newPush, setNewPush] = useState({
    title: "",
    message: "",
    url: "",
  });

  const [oneSignalAppId, setOneSignalAppId] = useState("");
  const [oneSignalRestKey, setOneSignalRestKey] = useState("");
  const [configSaving, setConfigSaving] = useState(false);
  const [siteId, setSiteId] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("x-site-id") || process.env.NEXT_PUBLIC_SITE_ID || "";
    setSiteId(id);
  }, []);

  useEffect(() => {
    if (siteId) {
      fetchNotifications();
      fetchOneSignalConfig();
    }
  }, [siteId]);

  async function fetchOneSignalConfig() {
    try {
      const res = await fetch("/api/admin/email/smtp", {
        headers: { "x-site-id": siteId }
      });
      const data = await res.json();
      if (data.success && data.data?.emailSettings) {
        setOneSignalAppId(data.data.emailSettings.oneSignalAppId || "");
        setOneSignalRestKey(data.data.emailSettings.oneSignalRestKey || "");
      }
    } catch (err) {
      console.error("Failed to load OneSignal config:", err);
    }
  }

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setConfigSaving(true);
    try {
      const res = await fetch("/api/admin/email/smtp", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-site-id": siteId
        },
        body: JSON.stringify({
          oneSignalAppId,
          oneSignalRestKey
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("OneSignal configuration saved successfully!");
        setShowConfig(false);
        fetchOneSignalConfig();
      } else {
        alert("Failed to save configuration: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving OneSignal configuration");
    }
    setConfigSaving(false);
  };

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/crm/push", {
        headers: { "x-site-id": siteId }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  useEffect(() => {
    setTimeout(() => {
      fetchNotifications();
      fetchOneSignalConfig();
    }, 0);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/crm/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-site-id": siteId
        },
        body: JSON.stringify(newPush)
      });
      const data = await res.json();
      if (data.success) {
        setNewPush({ title: "", message: "", url: "" });
        setShowAddForm(false);
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this push notification?")) return;
    try {
      const res = await fetch(`/api/crm/push/${id}`, {
        method: "DELETE",
        headers: { "x-site-id": siteId }
      });
      const data = await res.json();
      if (data.success) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (id) => {
    if (!confirm("Are you sure you want to send this push notification to all subscribed devices?")) return;
    alert("Triggering push dispatch...");
    try {
      const res = await fetch(`/api/crm/push/${id}/send`, {
        method: "POST",
        headers: { "x-site-id": siteId }
      });
      const data = await res.json();
      if (data.success) {
        alert(`Finished: Sent push notification successfully to ${data.data.recipients} devices!`);
        fetchNotifications();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Push Notifications
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Send instant desktop and mobile browser notifications using OneSignal
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white text-slate-700 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            <Settings size={14} /> OneSignal Settings
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus size={14} /> Compose Push
          </button>
        </div>
      </div>

      {showConfig && (
        <form onSubmit={handleSaveConfig} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 max-w-xl shadow-sm">
          <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <Settings size={16} /> OneSignal Credentials Configuration
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">OneSignal App ID</label>
              <input
                type="text"
                placeholder="e.g. 12345678-abcd-1234-abcd-1234567890ab"
                required
                value={oneSignalAppId}
                onChange={(e) => setOneSignalAppId(e.target.value)}
                className="p-2 border rounded text-xs dark:bg-slate-900 w-full"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">OneSignal REST API Key</label>
              <input
                type="password"
                placeholder="oneSignalRestKey"
                required
                value={oneSignalRestKey}
                onChange={(e) => setOneSignalRestKey(e.target.value)}
                className="p-2 border rounded text-xs dark:bg-slate-900 w-full"
              />
            </div>
          </div>
          <button type="submit" disabled={configSaving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold disabled:opacity-50">
            {configSaving ? "Saving..." : "Save Credentials"}
          </button>
        </form>
      )}

      {showAddForm && (
        <form onSubmit={handleCreate} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 max-w-xl">
          <h3 className="text-sm font-bold">Compose Push Alert</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Title (e.g. Breaking News!)"
              required
              value={newPush.title}
              onChange={(e) => setNewPush({ ...newPush, title: e.target.value })}
              className="p-2 border rounded text-xs dark:bg-slate-900 w-full"
            />
            <textarea
              placeholder="Notification Message Text..."
              required
              value={newPush.message}
              onChange={(e) => setNewPush({ ...newPush, message: e.target.value })}
              className="p-2 border rounded text-xs dark:bg-slate-900 w-full"
              rows={3}
            />
            <input
              type="url"
              placeholder="Target URL on click (e.g. https://yoursite.com/blog/topic)"
              value={newPush.url}
              onChange={(e) => setNewPush({ ...newPush, url: e.target.value })}
              className="p-2 border rounded text-xs dark:bg-slate-900 w-full"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded text-xs font-semibold">
            Save Draft Notification
          </button>
        </form>
      )}

      {/* Notifications list table */}
      <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading push notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No push notification records. Click &quot;Compose Push&quot; to write one.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="p-3">Title / Message</th>
                <th className="p-3">Redirect URL</th>
                <th className="p-3">Sent Count</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date Created</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
              {notifications.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                  <td className="p-3">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</span>
                      <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">{item.message}</p>
                    </div>
                  </td>
                  <td className="p-3 text-slate-500 truncate max-w-[150px]">{item.url || "-"}</td>
                  <td className="p-3 font-semibold text-slate-750">{item.sentCount}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${item.status === "sent"
                      ? "bg-green-50 text-green-700 border-green-150"
                      : item.status === "failed"
                        ? "bg-red-50 text-red-700 border-red-150"
                        : "bg-slate-50 text-slate-700 border-slate-150"
                      }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 text-[10px]">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end items-center">
                      {item.status === "draft" && (
                        <button
                          onClick={() => handleSend(item.id)}
                          title="Broadcast Push Alert"
                          className="p-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition"
                        >
                          <Send size={11} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
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
