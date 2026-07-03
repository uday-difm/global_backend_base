"use client";

import { useState } from "react";
import {
  Download,
  Upload,
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function BackupConsole({ siteId, initialHistory }) {
  const [history, setHistory] = useState(initialHistory);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isBackingUpMedia, setIsBackingUpMedia] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreText, setRestoreText] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const triggerBackup = async () => {
    setIsBackingUp(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/backup/database", {
        method: "POST",
        headers: {
          "x-site-id": siteId,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate backup");
      }

      const result = await res.json();
      const backup = result.data?.backup ?? result.backup;

      // Trigger browser download of the backup payload
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute(
        "download",
        `site_backup_${siteId}_${Date.now()}.json`,
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      // Refetch backup logs
      const historyRes = await fetch(`/api/admin/backup/history`, {
        headers: { "x-site-id": siteId },
      });
      const historyResult = await historyRes.json();
      const history =
        historyResult.data?.backupHistory ?? historyResult.backupHistory;
      if (history) {
        setHistory(history);
      }
      setSuccess("Database backup successfully compiled and downloaded!");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  const triggerMediaBackup = async () => {
    setIsBackingUpMedia(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/backup/media", {
        method: "POST",
        headers: {
          "x-site-id": siteId,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate media backup");
      }

      const result = await res.json();
      const backup = result.data?.backup ?? result.backup;

      // Trigger browser download of the media backup payload
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute(
        "download",
        `media_backup_${siteId}_${Date.now()}.json`,
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      // Refetch backup logs
      const historyRes = await fetch(`/api/admin/backup/history`, {
        headers: { "x-site-id": siteId },
      });
      const historyResult = await historyRes.json();
      const history =
        historyResult.data?.backupHistory ?? historyResult.backupHistory;
      if (history) {
        setHistory(history);
      }
      setSuccess("Media backup successfully compiled and downloaded!");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBackingUpMedia(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setRestoreFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setRestoreText(event.target.result);
    };
    reader.readAsText(file);
  };

  const triggerRestore = async (e) => {
    e.preventDefault();
    if (!restoreText) {
      setError("Please select a valid backup JSON file first.");
      return;
    }

    let parsedBackup;
    try {
      parsedBackup = JSON.parse(restoreText);
    } catch (err) {
      setError("Invalid file content. Must be a valid JSON file.");
      return;
    }

    const isMedia =
      parsedBackup && (parsedBackup.media || parsedBackup.folders);
    const confirmMessage = isMedia
      ? "CRITICAL WARNING: Restoring the media snapshot will delete and overwrite your current site media folders and file references. Are you sure you want to proceed?"
      : "CRITICAL WARNING: Restoring the database will overwrite your current site data. All current pages, testimonials, FAQs, team members, and leads will be rollbacked. Are you sure you want to proceed?";

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsRestoring(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/backup/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-site-id": siteId,
        },
        body: JSON.stringify({ backup: parsedBackup }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to restore backup");
      }

      const resJson = await res.json();
      const msg = resJson.data?.message ?? resJson.message;
      setSuccess(
        msg ||
          "Database successfully rollbacked and restored! Reloading state...",
      );
      setRestoreFile(null);
      setRestoreText("");

      // Refresh list
      const historyRes = await fetch(`/api/admin/backup/history`, {
        headers: { "x-site-id": siteId },
      });
      const historyResult = await historyRes.json();
      const history =
        historyResult.data?.backupHistory ?? historyResult.backupHistory;
      if (history) {
        setHistory(history);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Operations Panel */}
      <div className="lg:col-span-2 space-y-6">
        {/* Banner Alert Messages */}
        {error && (
          <div className="flex gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">
            <AlertCircle className="shrink-0" size={18} />
            <div>
              <strong className="font-semibold">Operation failed:</strong>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="flex gap-3 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm">
            <CheckCircle2 className="shrink-0" size={18} />
            <div>
              <strong className="font-semibold">Success:</strong>
              <p className="mt-0.5">{success}</p>
            </div>
          </div>
        )}

        {/* Compile Backup Card */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <div className="flex gap-3 items-start">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Database size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Compile Site Database Backup
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Generate an atomic snapshot of your website configuration
                including pages, blogs, services, testimonials, FAQs, redirects,
                and leads.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-gray-500">
              ⚡ Scope: All tables filtered under Site ID{" "}
              <span className="font-mono text-gray-800 bg-gray-200 px-1 py-0.5 rounded">
                {siteId}
              </span>
            </div>
            <button
              onClick={triggerBackup}
              disabled={isBackingUp || isBackingUpMedia || isRestoring}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-300 transition"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Compiling...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Download Backup JSON
                </>
              )}
            </button>
          </div>
        </div>

        {/* Compile Media Backup Card */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <div className="flex gap-3 items-start">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Upload size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Compile Site Media Snapshot
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Generate an atomic snapshot of your website media asset folders
                and file links stored inside Cloudinary.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-gray-500">
              ⚡ Scope: Media assets and folder hierarchies under Site ID{" "}
              <span className="font-mono text-gray-800 bg-gray-200 px-1 py-0.5 rounded">
                {siteId}
              </span>
            </div>
            <button
              onClick={triggerMediaBackup}
              disabled={isBackingUp || isBackingUpMedia || isRestoring}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:bg-emerald-300 transition"
            >
              {isBackingUpMedia ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Compiling...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Download Media JSON
                </>
              )}
            </button>
          </div>
        </div>

        {/* Restore Backup Card */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <div className="flex gap-3 items-start">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl border border-yellow-100">
              <Upload size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Atomic Rollback Restore
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Upload a previously compiled site JSON file (Database or Media)
                to restore the configuration state. Database operations are
                transactional: any error triggers a full rollback to keep data
                safe.
              </p>
            </div>
          </div>

          <form onSubmit={triggerRestore} className="space-y-4 pt-2">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-500 transition relative bg-gray-50/50">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isBackingUp || isBackingUpMedia || isRestoring}
              />
              <div className="space-y-2 text-sm text-gray-500">
                <Upload className="mx-auto text-gray-400" size={32} />
                <p>
                  {restoreFile ? (
                    <span className="font-semibold text-gray-900">
                      {restoreFile.name}
                    </span>
                  ) : (
                    <span>
                      Drag and drop your backup JSON file here, or click to
                      browse
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400">
                  JSON files up to 10MB (either Database or Media snapshots)
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={
                  isBackingUp || isBackingUpMedia || isRestoring || !restoreFile
                }
                className="flex items-center gap-2 rounded-lg bg-yellow-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-yellow-700 disabled:bg-gray-300 disabled:text-gray-500 transition"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    Restoring Data...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Upload & Restore Backup
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* History Log Panel */}
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
          Backup History
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-gray-400 italic text-center py-6">
            No previous backups recorded.
          </p>
        ) : (
          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {history.map((log) => (
              <div
                key={log.id}
                className="border rounded-lg p-3 text-xs space-y-1 hover:bg-gray-50/50"
              >
                <div className="flex justify-between font-semibold text-gray-800">
                  <span>
                    {log.type === "media" ? "Media Snapshot" : "Database Snap"}
                  </span>
                  <span className="text-gray-500">{formatBytes(log.size)}</span>
                </div>
                <div className="text-[10px] text-gray-400">
                  {new Date(log.timestamp).toLocaleString("en-US")}
                </div>
                <div
                  className="text-[10px] text-gray-500 font-mono truncate"
                  title={log.id}
                >
                  ID: {log.id}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

