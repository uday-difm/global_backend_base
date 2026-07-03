"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import JoditEditor from "jodit-react";
//---------------------------------------------------------------------------
// Block-JSON → HTML converter
// Handles old BlockNote JSON so existing posts don't show blank content.
// ---------------------------------------------------------------------------
function blocksToHtml(blocks) {
  if (!Array.isArray(blocks)) return "";

  const renderInline = (contentArr) => {
    if (!contentArr) return "";
    return contentArr
      .map((node) => {
        if (typeof node === "string") return node;
        if (node.type === "text") {
          let text = node.text || "";
          const s = node.styles || {};
          if (s.bold) text = `<strong>${text}</strong>`;
          if (s.italic) text = `<em>${text}</em>`;
          if (s.underline) text = `<u>${text}</u>`;
          if (s.strike) text = `<s>${text}</s>`;
          if (s.code) text = `<code>${text}</code>`;
          return text;
        }
        if (node.type === "link") {
          const inner = renderInline(node.content);
          return `<a href="${node.href || "#"}">${inner}</a>`;
        }
        return node.text || "";
      })
      .join("");
  };

  return blocks
    .map((block) => {
      const inner = renderInline(block.content);
      const children =
        block.children && block.children.length
          ? blocksToHtml(block.children)
          : "";

      switch (block.type) {
        case "heading": {
          const level = block.props?.level || 1;
          return `<h${level}>${inner}</h${level}>`;
        }
        case "paragraph":
          return inner ? `<p>${inner}</p>` : "<p><br></p>";
        case "bulletListItem":
          return `<li>${inner}${children}</li>`;
        case "numberedListItem":
          return `<li>${inner}${children}</li>`;
        case "checkListItem":
          return `<li>${block.props?.checked ? "☑" : "☐"} ${inner}</li>`;
        case "image":
          return `<img src="${block.props?.url || ""}" alt="${block.props?.caption || ""}" />`;
        case "quote":
          return `<blockquote>${inner}</blockquote>`;
        case "code":
          return `<pre><code>${inner}</code></pre>`;
        case "table": {
          const rows = (block.content?.rows || [])
            .map(
              (row) =>
                `<tr>${(row.cells || []).map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`
            )
            .join("");
          return `<table><tbody>${rows}</tbody></table>`;
        }
        default:
          return inner ? `<p>${inner}</p>` : "";
      }
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// Try to turn initialContent (BlockNote JSON string) into displayable HTML
// ---------------------------------------------------------------------------
function resolveInitialHtml(initialContent, fallbackHtml) {
  if (initialContent) {
    try {
      const parsed = JSON.parse(initialContent);
      // BlockNote JSON is an array of blocks
      if (Array.isArray(parsed)) {
        const html = blocksToHtml(parsed);
        if (html) return html;
      }
    } catch {
      // Not JSON — treat as raw HTML
      return initialContent;
    }
  }
  return fallbackHtml || "";
}

// ---------------------------------------------------------------------------
// Jodit toolbar config
// ---------------------------------------------------------------------------
function useJoditConfig({ isDark, placeholder }) {
  return useMemo(
    () => ({
      readonly: false,
      height: 560,
      minHeight: 300,
      theme: isDark ? "dark" : "default",
      placeholder: placeholder || "Start typing...",
      toolbarAdaptive: false,
      toolbarSticky: true,
      showCharsCounter: true,
      showWordsCounter: true,
      showXPathInStatusbar: false,
      spellcheck: true,
      language: "en",
      // Clean up Word / browser paste junk
      cleanHTML: {
        cleanOnPaste: true,
        removeEmptyElements: false,
        fillEmptyParagraph: true,
      },
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: "insert_clear_html",
      buttons: [
        "source",
        "|",
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "superscript",
        "subscript",
        "|",
        "ul",
        "ol",
        "|",
        "outdent",
        "indent",
        "|",
        "font",
        "fontsize",
        "brush",
        "paragraph",
        "|",
        "image",
        "video",
        "table",
        "link",
        "|",
        "align",
        "undo",
        "redo",
        "|",
        "hr",
        "symbol",
        "eraser",
        "copyformat",
        "|",
        "selectall",
        "print",
        "find",
        "|",
        "fullsize",
      ],
      style: isDark
        ? {
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "15px",
            background: "#0f172a",
            color: "#f8fafc",
          }
        : {
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "15px",
          },
      enter: "P",
      defaultMode: 1, // WYSIWYG
    }),
    [isDark, placeholder]
  );
}

// ---------------------------------------------------------------------------
// Main editor component
// Props (same interface as the old BlockNote editor):
//   initialContent  – BlockNote JSON string OR raw HTML string (optional)
//   fallbackHtml    – HTML string to show when initialContent is absent (optional)
//   onChangeHtml    – callback(htmlString) fired on every content change
//   onChangeJson    – callback(htmlString) — kept for API compatibility; receives same HTML
// ---------------------------------------------------------------------------
export default function BlockEditor({
  initialContent,
  fallbackHtml,
  onChangeHtml,
  onChangeJson,
  placeholder,
}) {
  const editorRef = useRef(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    // Detect dark mode class on mount
    setIsDark(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const config = useJoditConfig({ isDark, placeholder });

  const initialHtml = useMemo(
    () => resolveInitialHtml(initialContent, fallbackHtml),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // only compute once on mount — Jodit is uncontrolled after init
  );

  function handleChange(newHtml) {
    if (onChangeHtml) onChangeHtml(newHtml);
    // Mirror to onChangeJson for API compatibility with PostEditor / LegalEditor
    if (onChangeJson) onChangeJson(newHtml);
  }

  return (
    <div className="jodit-wrapper rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <JoditEditor
        key={isDark ? "dark" : "light"}
        ref={editorRef}
        value={initialHtml}
        config={config}
        onBlur={handleChange}
        onChange={handleChange}
      />
    </div>
  );
}
