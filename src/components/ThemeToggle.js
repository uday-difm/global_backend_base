// src/components/ThemeToggle.js
"use client";
import { useEffect, useState } from "react";
import { useTheme } from "./providers/ThemeProvider";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState("light");

  // Avoid hydration mismatch — only render actual UI after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      setResolvedTheme(systemTheme);
    } else {
      setResolvedTheme(theme);
    }
  }, [theme, mounted]);

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

  const isDark = resolvedTheme === "dark";

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
