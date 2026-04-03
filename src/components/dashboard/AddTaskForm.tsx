"use client";
import { useState, useRef } from "react";
import { Tag, X } from "lucide-react";

interface Props { onAdd: (data: any) => void; }

const PRESET_TAGS = ["work", "personal", "health", "learning", "urgent"];

export default function AddTaskForm({ onAdd }: Props) {
  const [focused, setFocused] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [duration, setDuration] = useState("25");
  const [reminder, setReminder] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [recurring, setRecurring] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (t: string) => {
    const clean = t.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (clean && !tags.includes(clean) && tags.length < 5) setTags(prev => [...prev, clean]);
    setTagInput("");
  };

  const submit = () => {
    if (!title.trim()) { inputRef.current?.focus(); return; }
    onAdd({
      title: title.trim(), priority,
      pomoDuration: parseInt(duration),
      reminderTime: reminder || null,
      dueDate: dueDate || null,
      notes,
      tags: tags.join(","),
      recurring: recurring || null,
    });
    setTitle(""); setReminder(""); setNotes(""); setDueDate("");
    setTags([]); setTagInput(""); setRecurring("");
  };

  return (
    <div className="mb-4 rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: "white",
        border: `1.5px ${focused ? "solid" : "dashed"} ${focused ? "var(--gold2)" : "var(--cream3)"}`,
        boxShadow: focused ? "0 0 0 3px rgba(196,154,42,0.1), 0 4px 16px rgba(15,14,12,0.08)" : undefined,
      }}>
      {/* Input row */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-lg font-light flex-shrink-0 transition-all"
          style={{ background: focused ? "var(--gold2)" : "var(--gold4)", color: focused ? "white" : "var(--gold)" }}>+</div>
        <input ref={inputRef} type="text" value={title} onChange={e => setTitle(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 200)}
          onKeyDown={e => { if (e.key === "Enter") submit(); }}
          placeholder="Add a task… press Enter to save"
          className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
          style={{ color: "var(--ink)", fontFamily: "'Outfit', sans-serif" }} />
        {focused && title && (
          <button onClick={submit}
            className="flex-shrink-0 h-7 px-3.5 rounded-lg text-xs font-bold tracking-wide transition-all"
            style={{ background: "var(--ink)", color: "var(--gold3)" }}>
            Add
          </button>
        )}
      </div>

      {/* Meta row */}
      {focused && (
        <div className="px-4 pb-3 pt-1 space-y-2.5 animate-fade-in" style={{ borderTop: "1px solid rgba(15,14,12,0.06)" }}>
          {/* Row 1: priority, duration, reminder, due date */}
          <div className="flex items-center gap-2 flex-wrap">
            <MetaSelect value={priority} onChange={setPriority} options={[["medium","◯ Medium"],["high","● High"],["low","● Low"]]} />
            <MetaSelect value={duration} onChange={setDuration} options={[["25","⏱ 25min"],["50","⏱ 50min"],["15","⏱ 15min"],["10","⏱ 10min"],["5","⏱ 5min"]]} />
            <input type="time" value={reminder} onChange={e => setReminder(e.target.value)}
              className="rounded-lg px-2.5 py-1.5 text-xs border outline-none transition-colors font-mono"
              style={{ background: "var(--cream)", border: "1px solid var(--cream3)", color: "var(--ink3)" }}
              title="Set reminder time" />
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="rounded-lg px-2.5 py-1.5 text-xs border outline-none transition-colors font-mono"
              style={{ background: "var(--cream)", border: "1px solid var(--cream3)", color: "var(--ink3)" }}
              title="Due date" />
            <MetaSelect value={recurring} onChange={setRecurring} options={[["","↻ Once"],["daily","↻ Daily"],["weekly","↻ Weekly"],["monthly","↻ Monthly"]]} />
          </div>

          {/* Row 2: Tags */}
          <div>
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <Tag size={11} style={{ color: "var(--ghost)" }} />
              {PRESET_TAGS.filter(t => !tags.includes(t)).map(t => (
                <button key={t} onClick={() => addTag(t)}
                  className="h-5 px-2 rounded-full text-xs transition-all"
                  style={{ border: "1px solid var(--cream3)", color: "var(--muted)", background: "var(--cream)" }}>
                  +{t}
                </button>
              ))}
              {tags.map(t => (
                <span key={t} className="h-5 px-2 rounded-full text-xs flex items-center gap-1"
                  style={{ background: "var(--gold4)", border: "1px solid rgba(196,154,42,0.3)", color: "var(--gold)" }}>
                  {t}
                  <button onClick={() => setTags(prev => prev.filter(x => x !== t))} style={{ color: "var(--gold)" }}><X size={9} /></button>
                </span>
              ))}
              {tags.length < 5 && (
                <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); } }}
                  placeholder="custom tag…"
                  className="h-5 px-2 rounded-full text-xs outline-none bg-transparent"
                  style={{ border: "1px dashed var(--cream3)", color: "var(--muted)", minWidth: 80 }} />
              )}
            </div>
          </div>

          {/* Notes */}
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Optional notes for this task…"
            className="textarea-base text-xs" rows={2}
            style={{ minHeight: 52, fontSize: 12 }} />

          <div className="flex justify-end">
            <span className="text-xs font-mono flex items-center gap-1" style={{ color: "var(--ghost)" }}>
              <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: "var(--cream3)", border: "1px solid var(--cream4)", color: "var(--muted)", fontSize: 9 }}>↵</kbd>
              to add
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function MetaSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="rounded-lg px-2.5 py-1.5 text-xs font-semibold border outline-none cursor-pointer appearance-none transition-colors"
      style={{ background: "var(--cream)", border: "1px solid var(--cream3)", color: "var(--ink3)", fontFamily: "'Outfit', sans-serif" }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
