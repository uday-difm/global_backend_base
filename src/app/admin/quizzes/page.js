"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  HelpCircle,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  BarChart2,
  BookOpen,
  AlertCircle,
  Loader2,
  GripVertical,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

function emptyForm() {
  return {
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "0",
    explanation: "",
  };
}

// ─── Option Input Row ────────────────────────────────────────────────────────

function OptionRow({ index, value, isCorrect, onChange, onCorrect }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onCorrect(index)}
        title={isCorrect ? "Correct answer" : "Mark as correct"}
        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          isCorrect
            ? "bg-green-500 border-green-500 text-white"
            : "border-slate-300 hover:border-green-400"
        }`}
      >
        {isCorrect && <Check size={12} />}
      </button>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(index, e.target.value)}
        placeholder={`Option ${index + 1}`}
        className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
      />
      <span className={`text-[10px] font-bold w-14 text-right ${isCorrect ? "text-green-600" : "text-slate-400"}`}>
        {isCorrect ? "✓ Correct" : `Option ${index + 1}`}
      </span>
    </div>
  );
}

// ─── Quiz Form ───────────────────────────────────────────────────────────────

function QuizForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || emptyForm());

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const setOption = (i, val) => {
    const opts = [...form.options];
    opts[i] = val;
    setField("options", opts);
  };

  const addOption = () => {
    if (form.options.length >= 6) return;
    setField("options", [...form.options, ""]);
  };

  const removeOption = (i) => {
    if (form.options.length <= 2) return;
    const opts = form.options.filter((_, idx) => idx !== i);
    // If removed option was the correct one, reset to 0
    const newCorrect = parseInt(form.correctAnswer) === i
      ? "0"
      : parseInt(form.correctAnswer) > i
      ? String(parseInt(form.correctAnswer) - 1)
      : form.correctAnswer;
    setForm((f) => ({ ...f, options: opts, correctAnswer: newCorrect }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const filled = form.options.filter((o) => o.trim());
    if (filled.length < 2) {
      alert("Please provide at least 2 options.");
      return;
    }
    onSave({ ...form, options: form.options.filter((o) => o.trim()) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Question */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Question <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.question}
          onChange={(e) => setField("question", e.target.value)}
          required
          rows={3}
          placeholder="Type your quiz question here…"
          className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-none"
        />
      </div>

      {/* Options */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Answer Options <span className="text-red-500">*</span>
          </label>
          <span className="text-[10px] text-slate-400">Click ○ to mark correct answer</span>
        </div>
        <div className="space-y-2">
          {form.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <OptionRow
                index={i}
                value={opt}
                isCorrect={form.correctAnswer === String(i)}
                onChange={setOption}
                onCorrect={(idx) => setField("correctAnswer", String(idx))}
              />
              {form.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="shrink-0 p-1 text-slate-300 hover:text-red-500 transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        {form.options.length < 6 && (
          <button
            type="button"
            onClick={addOption}
            className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
          >
            <Plus size={13} /> Add Option
          </button>
        )}
      </div>

      {/* Explanation */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Explanation <span className="text-slate-300">(optional)</span>
        </label>
        <textarea
          value={form.explanation}
          onChange={(e) => setField("explanation", e.target.value)}
          rows={2}
          placeholder="Explain why the correct answer is right…"
          className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl shadow-sm transition flex items-center gap-1.5"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          {saving ? "Saving…" : "Save Question"}
        </button>
      </div>
    </form>
  );
}

// ─── Quiz Row ────────────────────────────────────────────────────────────────

function QuizRow({ quiz, onEdit, onDelete, deleting }) {
  const [expanded, setExpanded] = useState(false);
  const correctIdx = parseInt(quiz.correctAnswer);
  const correctLabel = quiz.options[correctIdx] ?? "—";

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden transition hover:shadow-md">
      {/* Header row */}
      <div
        className="flex items-start gap-3 px-5 py-4 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
          <HelpCircle size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
            {quiz.question}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <span className="text-[11px] text-slate-400">
              {quiz.options.length} options
            </span>
            <span className="flex items-center gap-1 text-[11px] text-green-600 font-semibold">
              <Check size={11} /> {correctLabel}
            </span>
            {quiz.playCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <BarChart2 size={11} /> {quiz.playCount} plays
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(quiz); }}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(quiz.id); }}
            disabled={deleting === quiz.id}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition"
            title="Delete"
          >
            {deleting === quiz.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
          <button className="p-1.5 rounded-lg text-slate-300 transition">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-4 pt-3 space-y-3 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quiz.options.map((opt, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                  i === correctIdx
                    ? "bg-green-50 border-green-200 text-green-800 font-semibold"
                    : "bg-white border-slate-100 text-slate-600"
                }`}
              >
                {i === correctIdx ? (
                  <Check size={13} className="text-green-500 shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0" />
                )}
                {opt}
              </div>
            ))}
          </div>
          {quiz.explanation && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 leading-relaxed">
              <span className="font-bold">Explanation: </span>{quiz.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function QuizzesAdminPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // quiz being edited
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/quizzes");
      if (!res.ok) throw new Error("Failed to load quizzes");
      setQuizzes(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Save (create or update)
  const handleSave = async (form) => {
    setSaving(true);
    try {
      const isEdit = !!editTarget;
      const url = isEdit ? `/api/admin/quizzes/${editTarget.id}` : "/api/admin/quizzes";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Save failed");
      }

      setShowForm(false);
      setEditTarget(null);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (quiz) => {
    setEditTarget({
      ...quiz,
      options: [...quiz.options],
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this quiz question? This also removes associated analytics.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/quizzes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = quizzes.filter((q) =>
    q.question.toLowerCase().includes(search.toLowerCase())
  );

  const totalPlays = quizzes.reduce((sum, q) => sum + (q.playCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Quiz Manager</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create and manage quiz questions shown on the Quizzes page.
          </p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowForm(true); }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/10 transition-all"
        >
          <Plus size={14} /> Add Question
        </button>
      </div>

      {/* ── Metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <HelpCircle size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Questions</div>
            <div className="text-2xl font-bold text-slate-900">{quizzes.length}</div>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-green-50 text-green-600">
            <BarChart2 size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Answers</div>
            <div className="text-2xl font-bold text-slate-900">{totalPlays}</div>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <BookOpen size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg per Question</div>
            <div className="text-2xl font-bold text-slate-900">
              {quizzes.length ? Math.round(totalPlays / quizzes.length) : 0}
            </div>
          </div>
        </div>
      </div>

      {/* ── Add / Edit Form ── */}
      {showForm && (
        <div className="bg-white border border-indigo-100 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800">
              {editTarget ? "Edit Question" : "New Question"}
            </h2>
            <button
              onClick={() => { setShowForm(false); setEditTarget(null); }}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X size={16} />
            </button>
          </div>
          <QuizForm
            initial={editTarget ? {
              question: editTarget.question,
              options: editTarget.options,
              correctAnswer: editTarget.correctAnswer,
              explanation: editTarget.explanation || "",
            } : undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditTarget(null); }}
            saving={saving}
          />
        </div>
      )}

      {/* ── Search + List ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions…"
            className="flex-1 max-w-sm px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs transition"
          />
          {search && (
            <span className="text-xs text-slate-500">
              {filtered.length} of {quizzes.length} shown
            </span>
          )}
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-indigo-500" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-medium">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <HelpCircle size={40} className="mb-3 opacity-40" />
            <p className="text-sm font-semibold">
              {search ? "No matching questions" : "No quiz questions yet"}
            </p>
            {!search && (
              <button
                onClick={() => { setEditTarget(null); setShowForm(true); }}
                className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
              >
                + Add your first question
              </button>
            )}
          </div>
        )}

        {!loading && !error && filtered.map((quiz) => (
          <QuizRow
            key={quiz.id}
            quiz={quiz}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deleting={deleting}
          />
        ))}
      </div>
    </div>
  );
}
