"use client";
import { useState, useRef, useEffect } from "react";
import type { Task } from "@/types";
import { Trash2, Timer, RotateCcw, ChevronDown, ChevronUp, FileText, Tag, X, Calendar, RefreshCw, GripVertical } from "lucide-react";
import clsx from "clsx";

interface Props {
  task: Task;
  onComplete: (id: string) => void;
  onReopen: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onStartPomo: (id: string) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

const PRIORITY_COLORS = { high: "var(--ruby)", medium: "var(--amber)", low: "var(--jade)" };
const PRIORITY_BG = { high: "var(--ruby2)", medium: "var(--amber2)", low: "var(--jade2)" };
const PRESET_TAGS = ["work", "personal", "health", "learning", "urgent"];

export default function TaskItem({ task, onComplete, onReopen, onDelete, onUpdate, onStartPomo, isDragging, dragHandleProps }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(task.notes || "");
  const [notesChanged, setNotesChanged] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(task.title);
  const [tags, setTags] = useState<string[]>(task.tags ? task.tags.split(",").filter(Boolean) : []);
  const [tagInput, setTagInput] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const titleRef = useRef<HTMLInputElement>(null);
  const isCompleted = task.status === "completed";

  useEffect(() => { setTitleVal(task.title); }, [task.title]);
  useEffect(() => { setTags(task.tags ? task.tags.split(",").filter(Boolean) : []); }, [task.tags]);
  useEffect(() => { setNotes(task.notes || ""); }, [task.notes]);

  // Debounce notes save
  useEffect(() => {
    if (!notesChanged) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onUpdate(task.id, { notes });
      setNotesChanged(false);
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [notes, notesChanged, task.id, onUpdate]);

  const saveTitle = () => {
    const t = titleVal.trim();
    if (t && t !== task.title) onUpdate(task.id, { title: t });
    else setTitleVal(task.title);
    setEditingTitle(false);
  };

  const addTag = (t: string) => {
    const clean = t.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (clean && !tags.includes(clean) && tags.length < 5) {
      const newTags = [...tags, clean];
      setTags(newTags);
      onUpdate(task.id, { tags: newTags.join(",") });
    }
    setTagInput("");
  };
  const removeTag = (t: string) => {
    const newTags = tags.filter(x => x !== t);
    setTags(newTags);
    onUpdate(task.id, { tags: newTags.join(",") });
  };

  const now = new Date();
  const overdue = !isCompleted && task.reminderTime && (() => {
    const [h, m] = task.reminderTime!.split(":").map(Number);
    const rd = new Date(); rd.setHours(h, m, 0, 0);
    return rd < now;
  })();

  const dueSoon = !isCompleted && task.dueDate && (() => {
    const d = new Date(task.dueDate!);
    const diff = (d.getTime() - now.getTime()) / 86400000;
    return diff <= 2;
  })();

  const dueOverdue = !isCompleted && task.dueDate && new Date(task.dueDate) < now;

  return (
    <div className={clsx(
      "rounded-xl transition-all duration-150 overflow-hidden animate-fade-in",
      isCompleted ? "opacity-55" : isDragging ? "shadow-2xl scale-[1.02] rotate-1" : "hover:-translate-y-px",
      expanded ? "shadow-md" : "hover:shadow-sm"
    )}
      style={{
        background: "white",
        border: `1px solid ${expanded ? "var(--gold2)" : "var(--cream3)"}`,
        boxShadow: expanded ? "0 0 0 2px rgba(196,154,42,0.1)" : undefined,
        borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`,
        cursor: isDragging ? "grabbing" : undefined,
      }}>

      {/* Main row */}
      <div className="flex items-center gap-3 px-3.5 py-3" onClick={() => !editingTitle && setExpanded(v => !v)} style={{ cursor: "pointer" }}>
        {/* Drag handle */}
        {!isCompleted && (
          <span {...dragHandleProps} onClick={e => e.stopPropagation()}
            className="flex-shrink-0 opacity-0 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            style={{ color: "var(--ghost)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0"}>
            <GripVertical size={14} />
          </span>
        )}

        {/* Checkbox */}
        <button
          onClick={e => { e.stopPropagation(); isCompleted ? onReopen(task.id) : onComplete(task.id); }}
          className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center text-xs transition-all"
          style={{
            border: `1.5px solid ${isCompleted ? "var(--jade)" : "var(--cream4)"}`,
            background: isCompleted ? "var(--jade)" : "transparent",
            color: isCompleted ? "white" : "transparent",
          }}
          onMouseEnter={e => { if (!isCompleted) { (e.currentTarget as HTMLElement).style.borderColor = "var(--jade)"; (e.currentTarget as HTMLElement).style.background = "var(--jade2)"; (e.currentTarget as HTMLElement).style.color = "var(--jade)"; } }}
          onMouseLeave={e => { if (!isCompleted) { (e.currentTarget as HTMLElement).style.borderColor = "var(--cream4)"; (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "transparent"; } }}>
          ✓
        </button>

        {/* Title + tags */}
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <input ref={titleRef} value={titleVal} autoFocus
              onChange={e => setTitleVal(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") { setTitleVal(task.title); setEditingTitle(false); } }}
              onClick={e => e.stopPropagation()}
              className="w-full bg-transparent border-b outline-none text-sm font-medium"
              style={{ color: "var(--ink)", borderColor: "var(--gold2)" }} />
          ) : (
            <p
              className={clsx("text-sm font-medium leading-snug mb-1", isCompleted && "line-through")}
              style={{ color: isCompleted ? "var(--faint)" : "var(--ink)" }}
              onDoubleClick={e => { e.stopPropagation(); if (!isCompleted) setEditingTitle(true); }}
              title="Double-click to edit">
              {task.title}
              {task.recurring && <span className="ml-1.5 text-xs" style={{ color: "var(--cobalt)" }} title={`Repeats ${task.recurring}`}><RefreshCw size={10} className="inline" /></span>}
            </p>
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs px-2 py-0.5 rounded-full font-bold uppercase"
              style={{ fontSize: 9, background: PRIORITY_BG[task.priority], color: PRIORITY_COLORS[task.priority], letterSpacing: "0.07em" }}>
              {task.priority}
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full"
              style={{ fontSize: 9, background: "rgba(37,99,184,0.1)", color: "var(--cobalt)" }}>
              ⏱ {task.pomoDuration}m
            </span>
            {task.dueDate && (
              <span className="font-mono text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                style={{ fontSize: 9, color: dueOverdue ? "var(--ruby)" : dueSoon ? "var(--amber)" : "var(--muted)" }}>
                <Calendar size={9} /> {task.dueDate}{dueOverdue ? " · overdue" : dueSoon ? " · soon" : ""}
              </span>
            )}
            {task.reminderTime && (
              <span className="font-mono text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                style={{ fontSize: 9, color: overdue ? "var(--ruby)" : "var(--muted)" }}>
                ⏰ {task.reminderTime}{overdue ? " · overdue" : ""}
              </span>
            )}
            {tags.slice(0, 2).map(t => (
              <span key={t} className="font-mono text-xs px-1.5 py-0.5 rounded-full"
                style={{ fontSize: 9, background: "var(--gold4)", color: "var(--gold)", border: "1px solid rgba(196,154,42,0.2)" }}>
                #{t}
              </span>
            ))}
            {tags.length > 2 && <span style={{ fontSize: 9, color: "var(--ghost)" }}>+{tags.length - 2}</span>}
            {task.notes && (
              <span className="flex items-center gap-0.5 text-xs" style={{ color: "var(--ghost)", fontSize: 10 }}>
                <FileText size={10} /> notes
              </span>
            )}
            {isCompleted && task.completedAt && (
              <span className="font-mono text-xs" style={{ fontSize: 9, color: "var(--faint)" }}>
                ✓ {new Date(task.completedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0"
          style={{ opacity: 0 }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0"}>
          {!isCompleted && (
            <ActionButton icon={<Timer size={12} />} title="Focus on this" onClick={e => { e.stopPropagation(); onStartPomo(task.id); }}
              hoverColor="var(--cobalt)" hoverBg="rgba(37,99,184,0.1)" />
          )}
          {!isCompleted && (
            <ActionButton icon={<span style={{fontSize:10}}>✎</span>} title="Edit title (or double-click)" onClick={e => { e.stopPropagation(); setEditingTitle(true); setExpanded(true); }}
              hoverColor="var(--amber)" hoverBg="var(--amber2)" />
          )}
          {isCompleted && (
            <ActionButton icon={<RotateCcw size={12} />} title="Reopen task" onClick={e => { e.stopPropagation(); onReopen(task.id); }}
              hoverColor="var(--amber)" hoverBg="var(--amber2)" />
          )}
          <ActionButton icon={<Trash2 size={12} />} title="Delete task" onClick={e => { e.stopPropagation(); onDelete(task.id); }}
            hoverColor="var(--ruby)" hoverBg="var(--ruby2)" />
        </div>

        {/* Expand chevron */}
        <span style={{ color: "var(--ghost)", flexShrink: 0 }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </div>

      {/* Expanded area */}
      {expanded && (
        <div className="px-3.5 pb-3.5 pt-0 animate-fade-in" onClick={e => e.stopPropagation()}>
          <div className="h-px mb-3" style={{ background: "rgba(15,14,12,0.06)" }} />

          {/* Due date + recurring */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--muted)", fontSize: 9 }}>Due Date</label>
              <input type="date" value={task.dueDate || ""}
                onChange={e => onUpdate(task.id, { dueDate: e.target.value || null })}
                className="rounded-lg px-2.5 py-1.5 text-xs border outline-none font-mono"
                style={{ background: "var(--cream)", border: "1px solid var(--cream3)", color: "var(--ink3)" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--muted)", fontSize: 9 }}>Repeat</label>
              <select value={task.recurring || ""}
                onChange={e => onUpdate(task.id, { recurring: (e.target.value || null) as any })}
                className="rounded-lg px-2.5 py-1.5 text-xs border outline-none appearance-none"
                style={{ background: "var(--cream)", border: "1px solid var(--cream3)", color: "var(--ink3)" }}>
                <option value="">Once</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Tags editor */}
          <div className="mb-3">
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)", fontSize: 9 }}>
              <Tag size={9} className="inline mr-1" />Tags
            </label>
            <div className="flex flex-wrap gap-1.5 items-center">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 h-5 px-2 rounded-full text-xs"
                  style={{ background: "var(--gold4)", border: "1px solid rgba(196,154,42,0.3)", color: "var(--gold)" }}>
                  #{t}
                  <button onClick={() => removeTag(t)}><X size={9} /></button>
                </span>
              ))}
              {PRESET_TAGS.filter(t => !tags.includes(t)).slice(0, 3).map(t => (
                <button key={t} onClick={() => addTag(t)}
                  className="h-5 px-2 rounded-full text-xs transition-all"
                  style={{ border: "1px solid var(--cream3)", color: "var(--muted)", background: "var(--cream)" }}>
                  +{t}
                </button>
              ))}
              {tags.length < 5 && (
                <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); } }}
                  placeholder="add tag…"
                  className="h-5 px-2 rounded-full text-xs outline-none bg-transparent"
                  style={{ border: "1px dashed var(--cream3)", color: "var(--muted)", minWidth: 70 }} />
              )}
            </div>
          </div>

          {/* Notes */}
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)", fontSize: 10 }}>
            📝 Notes
          </label>
          <textarea
            className="textarea-base"
            placeholder="Add notes, links, ideas, context…"
            value={notes}
            onChange={e => { setNotes(e.target.value); setNotesChanged(true); }}
            rows={4}
            style={{ background: "var(--cream)" }}
          />
          {notesChanged && <p className="text-xs mt-1" style={{ color: "var(--ghost)" }}>Saving…</p>}
        </div>
      )}
    </div>
  );
}

function ActionButton({ icon, title, onClick, hoverColor, hoverBg }: { icon: React.ReactNode; title: string; onClick: (e: React.MouseEvent) => void; hoverColor: string; hoverBg: string }) {
  return (
    <button title={title} onClick={onClick}
      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
      style={{ background: "var(--cream2)", color: "var(--muted)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = hoverBg; (e.currentTarget as HTMLElement).style.color = hoverColor; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--cream2)"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}>
      {icon}
    </button>
  );
}
