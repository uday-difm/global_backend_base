"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import the Jodit-based editor with SSR disabled
// (Jodit accesses window/document and cannot run server-side)
const Editor = dynamic(() => import("./BlockEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-12 border border-gray-200 rounded-xl bg-gray-50">
      <Loader2 className="animate-spin text-indigo-500" size={24} />
      <span className="ml-2 text-sm text-gray-500">Loading editor...</span>
    </div>
  ),
});

export default function DynamicBlockEditor(props) {
  return <Editor {...props} />;
}
