// DeleteUserButton.js (client)
"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmationModal from "@/components/dashboard/ConfirmationModal";

export default function DeleteUserButton({ userId, targetRole }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      // don't call res.json() blindly — handle non-JSON or empty responses
      let body = null;
      const text = await res.text();
      try {
        body = text ? JSON.parse(text) : null;
      } catch (e) {
        body = { error: text || null };
      }

      if (!res.ok) {
        const message =
          (body && (body.error || body.message)) ||
          `Delete failed — status ${res.status}`;
        toast.error(message);
        return;
      }

      // success
      toast.success("User deleted successfully");
      router.refresh();
      setShowConfirm(false);
    } catch (err) {
      console.error("Delete user network error:", err);
      toast.error("Network error while deleting user");
    }
  }

  return (
    <>
      <button
        className="px-2 py-1 bg-red-600 text-white rounded text-xs ml-2 cursor-pointer"
        onClick={() => setShowConfirm(true)}
      >
        Delete
      </button>

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Yes, Delete"
      />
    </>
  );
}

