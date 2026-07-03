// src/components/ThemeToggle.js
"use client";
import { useEffect, useState } from "react";
import { useTheme } from "./providers/ThemeProvider";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render actual UI after mount
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-md bg-white dark:bg-slate-800"
        aria-label="Toggle theme"
      >
        🌓
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-lg transition hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
      aria-label="Toggle theme"
    >
      {isDark ? "🌙" : "🌤️"}
    </button>
  );
}
