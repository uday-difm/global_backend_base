"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Upload, Folder, Home, ArrowLeft, Search, Image as ImageIcon, FileIcon, CheckCircle } from "lucide-react";

function getThumbnailUrl(url) {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  return url.replace("/upload/", "/upload/c_fill,w_200,h_200,g_auto,q_auto,f_auto/");
}

/**
 * MediaPickerModal
 * 
 * Props:
 *  - onSelect(mediaObj)  — called when user clicks a media item
 *  - onClose()           — called to close the modal
 *  - title               — optional heading text
 *  - filter              — "images" | "all" (default "images")
 */
export default function MediaPickerModal({ onSelect, onClose, title = "Select from Media Library", filter = "images", siteId }) {
  const [currentFolderId, setCurrentFolderId] = useState("root");
  const [folderHistory, setFolderHistory] = useState([{ id: "root", name: "Media Library" }]);

  const [media, setMedia] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);

  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState(null);

  const loadContents = useCallback(async () => {
    setLoading(true);
    try {
      const [mediaRes, foldersRes] = await Promise.all([
        fetch(`/api/media?folderId=${currentFolderId}`, {
          headers: {
            "x-site-id": siteId,
          },
        }),
        fetch(`/api/media/folders?parentId=${currentFolderId}`, {
          headers: {
            "x-site-id": siteId,
          },
        }),
      ]);

      const mediaData = await mediaRes.json();
      const foldersData = await foldersRes.json();

      let items = Array.isArray(mediaData) ? mediaData : [];

      // Apply filter
      if (filter === "images") {
        items = items.filter((m) => m.mimeType?.startsWith("image/"));
      }

      setMedia(items);
      setFolders(foldersData.folders || []);
    } catch (err) {
      console.error("MediaPickerModal load error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadContents();
  }, [loadContents]);

  // Folder navigation
  const navigateToFolder = (folder) => {
    setCurrentFolderId(folder.id);
    setFolderHistory((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const navigateToBreadcrumb = (index) => {
    const target = folderHistory[index];
    setCurrentFolderId(target.id);
    setFolderHistory((prev) => prev.slice(0, index + 1));
  };

  const navigateBack = () => {
    if (folderHistory.length <= 1) return;
    navigateToBreadcrumb(folderHistory.length - 2);
  };

  // Multi-file upload
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setUploadProgress(files.map((f) => ({ name: f.name, status: "pending" })));

    const folderIdVal = currentFolderId === "root" ? null : currentFolderId;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress((prev) =>
        prev.map((p, idx) => (idx === i ? { ...p, status: "uploading" } : p))
      );

      try {
        const formData = new FormData();
        formData.append("file", file);
        if (folderIdVal) formData.append("folderId", folderIdVal);

        const res = await fetch("/api/media/upload", {
          method: "POST",
          headers: {
            "x-site-id": siteId,
          },
          body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");

        setUploadProgress((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, status: "done" } : p))
        );
      } catch {
        setUploadProgress((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, status: "error" } : p))
        );
      }
    }

    e.target.value = "";
    setUploading(false);
    setUploadProgress([]);
    await loadContents();
  };

  // Filtered display
  const filteredMedia = media.filter((m) =>
    !search.trim() || m.fileName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[88vh] flex flex-col z-10 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          </div>
          <div className="flex items-center gap-3">
            {/* Upload button */}
            <label
              htmlFor="picker-upload"
              className={`inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <Upload size={13} className={uploading ? "animate-bounce" : ""} />
              {uploading ? "Uploading..." : "Upload"}
            </label>
            <input
              id="picker-upload"
              type="file"
              multiple
              accept={filter === "images" ? "image/*" : "*"}
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-900 rounded-md transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Upload progress strip */}
        {uploadProgress.length > 0 && (
          <div className="px-5 py-2 bg-blue-50 border-b border-blue-100 flex gap-3 flex-wrap shrink-0">
            {uploadProgress.map((p, i) => (
              <span key={i} className={`text-2xs font-semibold px-2 py-0.5 rounded-full border ${
                p.status === "done" ? "bg-green-50 text-green-700 border-green-200" :
                p.status === "error" ? "bg-red-50 text-red-700 border-red-200" :
                p.status === "uploading" ? "bg-blue-100 text-blue-700 border-blue-300 animate-pulse" :
                "bg-slate-100 text-slate-500 border-slate-200"
              }`}>
                {p.status === "done" ? "✓ " : p.status === "error" ? "✗ " : ""}{p.name}
              </span>
            ))}
          </div>
        )}

        {/* Breadcrumb + Search bar */}
        <div className="px-5 py-2 flex items-center gap-3 border-b bg-white shrink-0">
          {/* Back arrow */}
          {currentFolderId !== "root" && (
            <button onClick={navigateBack} className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors">
              <ArrowLeft size={14} />
            </button>
          )}

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 flex-wrap text-xs min-w-0 flex-1">
            {folderHistory.map((f, idx) => (
              <span key={f.id} className="flex items-center gap-1">
                {idx > 0 && <span className="text-slate-300">/</span>}
                <button
                  onClick={() => navigateToBreadcrumb(idx)}
                  className={`font-semibold hover:text-blue-600 transition-colors ${
                    idx === folderHistory.length - 1 ? "text-slate-800 pointer-events-none" : "text-slate-400"
                  }`}
                >
                  {f.id === "root" ? <span className="flex items-center gap-0.5"><Home size={11} /> Root</span> : f.name}
                </button>
              </span>
            ))}
          </div>

          {/* Search */}
          <div className="relative shrink-0">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files..."
              className="pl-6 pr-2 py-1 text-xs border border-slate-200 rounded-md bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Loading media library...</div>
          ) : (
            <div className="space-y-6">

              {/* Folders */}
              {folders.length > 0 && !search && (
                <div className="space-y-2">
                  <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Folders</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {folders.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => navigateToFolder(f)}
                        className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm text-left transition-all group"
                      >
                        <Folder className="h-7 w-7 text-amber-500 fill-amber-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="block text-xs font-semibold text-slate-800 truncate">{f.name}</span>
                          <span className="block text-2xs text-slate-400">{f._count?.media || 0} files</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Media files */}
              <div className="space-y-2">
                {folders.length > 0 && !search && (
                  <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Files</p>
                )}
                {filteredMedia.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-lg bg-white">
                    {search ? `No files matching "${search}"` : "No files in this folder. Upload some above!"}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {filteredMedia.map((m) => {
                      const isImage = m.mimeType?.startsWith("image/");
                      const isHovered = hoveredId === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => onSelect(m)}
                          onMouseEnter={() => setHoveredId(m.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          className="group relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 hover:border-blue-500 bg-white transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          title={m.fileName}
                        >
                          {isImage ? (
                            <img
                              src={getThumbnailUrl(m.secureUrl || m.url)}
                              alt={m.altText || m.fileName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100">
                              <FileIcon className="h-8 w-8 text-slate-400" />
                            </div>
                          )}

                          {/* Hover overlay */}
                          <div className={`absolute inset-0 bg-blue-600/70 flex flex-col items-center justify-center transition-opacity ${isHovered ? "opacity-100" : "opacity-0"}`}>
                            <CheckCircle className="h-5 w-5 text-white mb-1" />
                            <span className="text-2xs text-white font-bold">Select</span>
                          </div>

                          {/* Filename strip */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="block text-2xs text-white truncate">{m.fileName}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-white flex items-center justify-between shrink-0">
          <p className="text-2xs text-slate-400">
            {filteredMedia.length} {filter === "images" ? "image" : "file"}{filteredMedia.length !== 1 ? "s" : ""} in this folder
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold border border-slate-200 rounded-md hover:bg-slate-50 text-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
