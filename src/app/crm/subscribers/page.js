"use client";

import { useState, useEffect } from "react";
import { Users, Upload, Plus, Trash2, Mail, Tag, Filter } from "lucide-react";

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [lists, setLists] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [newSub, setNewSub] = useState({ name: "", email: "", status: "active", tags: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [selectedListId, setSelectedListId] = useState("");
  const [siteId, setSiteId] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("x-site-id") || process.env.NEXT_PUBLIC_SITE_ID || "";
    setSiteId(id);
  }, []);

  useEffect(() => {
    if (siteId) {
      fetchSubscribers();
      fetchLists();
    }
  }, [search, statusFilter, siteId]);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/subscribers?search=${search}&status=${statusFilter}`, {
        headers: { "x-site-id": siteId }
      });
      const data = await res.json();
      if (!data.error) {
        setSubscribers(data.data?.subscribers || []);
        setTotal(data.data?.total || 0);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchLists = async () => {
    try {
      const res = await fetch("/api/crm/lists", {
        headers: { "x-site-id": siteId }
      });
      const data = await res.json();
      if (!data.error) {
        setLists(data.data?.lists || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/crm/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-site-id": siteId
        },
        body: JSON.stringify(newSub)
      });
      const data = await res.json();
      if (!data.error) {
        setNewSub({ name: "", email: "", status: "active", tags: "" });
        setShowAddForm(false);
        fetchSubscribers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this subscriber?")) return;
    try {
      const res = await fetch(`/api/crm/subscribers/${id}`, {
        method: "DELETE",
        headers: { "x-site-id": siteId }
      });
      const data = await res.json();
      if (data.success) {
        fetchSubscribers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return alert("Please select a CSV file first");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split("\n");
      const headers = lines[0].split(",");
      
      const emailIdx = headers.findIndex(h => h.toLowerCase().includes("email"));
      const nameIdx = headers.findIndex(h => h.toLowerCase().includes("name"));

      if (emailIdx === -1) {
        alert("CSV must contain an 'email' column header");
        return;
      }

      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue;
        const cols = lines[i].split(",");
        rows.push({
          email: cols[emailIdx]?.trim(),
          name: nameIdx !== -1 ? cols[nameIdx]?.trim() : null
        });
      }

      try {
        const res = await fetch("/api/crm/subscribers/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-site-id": siteId
          },
          body: JSON.stringify({
            listId: selectedListId || null,
            subscribers: rows
          })
        });
        const data = await res.json();
        if (data.success) {
          alert(`Successfully imported ${data.data.count} subscribers!`);
          setCsvFile(null);
          fetchSubscribers();
        }
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsText(csvFile);
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Subscriber Directory
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Total Contacts: <span className="font-semibold text-slate-800 dark:text-slate-200">{total}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus size={14} /> Add Contact
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 max-w-xl">
          <h3 className="text-sm font-bold">New Subscriber</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Name"
              value={newSub.name}
              onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
              className="p-2 border rounded text-xs dark:bg-slate-900 w-full"
            />
            <input
              type="email"
              placeholder="Email"
              required
              value={newSub.email}
              onChange={(e) => setNewSub({ ...newSub, email: e.target.value })}
              className="p-2 border rounded text-xs dark:bg-slate-900 w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Tags (comma-separated)"
              value={newSub.tags}
              onChange={(e) => setNewSub({ ...newSub, tags: e.target.value })}
              className="p-2 border rounded text-xs dark:bg-slate-900 w-full"
            />
            <select
              value={newSub.status}
              onChange={(e) => setNewSub({ ...newSub, status: e.target.value })}
              className="p-2 border rounded text-xs dark:bg-slate-900 w-full"
            >
              <option value="active">Active</option>
              <option value="unsubscribed">Unsubscribed</option>
              <option value="bounced">Bounced</option>
              <option value="spam">Spam</option>
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded text-xs font-semibold">
            Save Subscriber
          </button>
        </form>
      )}

      {/* CSV Import card */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl max-w-xl space-y-3">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Upload size={14} /> Import from CSV File
        </h3>
        <p className="text-[10px] text-slate-400">CSV file must include at least an <code>email</code> column header.</p>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files[0])}
            className="text-xs"
          />
          <select
            value={selectedListId}
            onChange={(e) => setSelectedListId(e.target.value)}
            className="p-1.5 border rounded text-xs dark:bg-slate-900"
          >
            <option value="">No list (import only)</option>
            {lists.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <button onClick={handleCsvUpload} className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded hover:bg-slate-700">
            Upload & Import
          </button>
        </div>
      </div>

      {/* Filter and search */}
      <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-slate-800 p-3 rounded-lg border dark:border-slate-700">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded text-xs w-full dark:bg-slate-900"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border rounded text-xs dark:bg-slate-900"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="bounced">Bounced</option>
            <option value="spam">Spam</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading directory...</div>
        ) : subscribers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No subscribers match the query parameters.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="p-3">Subscriber</th>
                <th className="p-3">Lists</th>
                <th className="p-3">Tags</th>
                <th className="p-3">Status</th>
                <th className="p-3">Subscribed At</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
              {subscribers.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                  <td className="p-3">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{item.name || "Anonymous"}</span>
                      <p className="text-[10px] text-slate-400">{item.email}</p>
                    </div>
                  </td>
                  <td className="p-3 text-[10px] text-slate-500">
                    {item.lists?.map(l => l.list.name).join(", ") || "-"}
                  </td>
                  <td className="p-3">
                    {item.tags ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-750 text-[10px]">
                        <Tag size={8} /> {item.tags}
                      </span>
                    ) : "-"}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      item.status === "active"
                        ? "bg-green-50 text-green-700 border-green-150"
                        : "bg-red-50 text-red-700 border-red-150"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 text-[10px]">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                    >
                      <Trash2 size={12} />
                    </button>
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
