// global_backend/src/app/(dashboard)/pages/PublishToggle.js
"use client";

import { useState } from "react";
import { toast } from "sonner";

/*
 PublishToggle client component
 Props:
  - pageId: string
  - initialStatus: "DRAFT" | "PUBLISHED"
*/
export default function PublishToggle({ pageId, initialStatus, siteId }) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const newStatus = status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
      const res = await fetch(`/api/admin/pages/${pageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-site-id": siteId,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to update page status");
      } else {
        setStatus(json.page?.status ?? newStatus);
        toast.success(`Page status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error("Toggle publish error", err);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-2 py-1 text-xs rounded ${status === "PUBLISHED" ? "bg-gray-200 text-black" : "bg-gray-200 text-black"}`}
      title={status === "PUBLISHED" ? "Unpublish" : "Publish"}
    >
      {loading ? "..." : status === "PUBLISHED" ? "Unpublish" : "Publish"}
    </button>
  );
}

