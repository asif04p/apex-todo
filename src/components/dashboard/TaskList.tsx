"use client";
import { useState, useRef } from "react";
import type { Task } from "@/types";
import type { View, Filter, ListMode } from "./DashboardClient";
import TaskItem from "./TaskItem";
import AddTaskForm from "./AddTaskForm";
import { LayoutList, LayoutGrid, Timer, ChevronDown, ChevronRight, Search, X, Download } from "lucide-react";

interface Props {
  view: View; filter: Filter; setFilter: (f: Filter) => void;
  listMode: ListMode; setListMode: (m: ListMode) => void;
  tasks: Task[]; allActive: Task[]; allCompleted: Task[];
  userName: string;
  onComplete: (id: string) => void; onReopen: (id: string) => void;
  onDelete: (id: string) => void; onAdd: (data: any) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onStartPomo: (id: string) => void; onOpenPomo: () => void;
  onBulkComplete: (ids: string[]) => void;
  onBulkDelete: (ids: string[]) => void;
  onReorder: (tasks: Task[]) => void;
  onExport: (format: "csv" | "json") => void;
}

const VIEW_LABELS: Record<View, { title: string; sub: string }> = {
  today:     { title: "Today",          sub: "— let's get to work" },
  upcoming:  { title: "Upcoming",       sub: "— tasks with reminders" },
  all:       { title: "All Tasks",      sub: "— everything at a glance" },
  completed: { title: "Completed",      sub: "— tasks you've finished" },
  stats:     { title: "Progress",       sub: "— your journey so far" },
  high:      { title: "High Priority",  sub: "— critical tasks" },
  medium:    { title: "Medium Priority",sub: "— important tasks" },
  low:       { title: "Low Priority",   sub: "— when you have time" },
  search:    { title: "Search",         sub: "— find anything" },
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all",      label: "All" },
  { key: "high",     label: "🔴 High" },
  { key: "medium",   label: "🟡 Medium" },
  { key: "low",      label: "🟢 Low" },
  { key: "reminder", label: "🔔 Reminders" },
  { key: "due",      label: "📅 Due" },
  { key: "tagged",   label: "🏷 Tagged" },
];

export default function TaskList({
  view, filter, setFilter, listMode, setListMode,
  tasks, allActive, allCompleted, userName,
  onComplete, onReopen, onDelete, onAdd, onUpdate, onStartPomo, onOpenPomo,
  onBulkComplete, onBulkDelete, onReorder, onExport,
}: Props) {
  const [showCompletedInAll, setShowCompletedInAll] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showExport, setShowExport] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);

  const cfg = VIEW_LABELS[view] || VIEW_LABELS.today;
  const isCompleted = view === "completed";
  const h = new Date().getHours();
  const tod = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  const firstName = userName.split(" ")[0];
  const total = allActive.length + allCompleted.length;
  const pct = total ? Math.round((allCompleted.length / total) * 100) : 0;

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const clearSelected = () => setSelected(new Set());

  // Drag-and-drop reorder
  const handleDragStart = (index: number) => { dragItem.current = index; setDragIndex(index); };
  const handleDragEnter = (index: number) => { setDragOverIndex(index); };
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverIndex !== null && dragItem.current !== dragOverIndex) {
      const newTasks = [...tasks];
      const [removed] = newTasks.splice(dragItem.current, 1);
      newTasks.splice(dragOverIndex, 0, removed);
      onReorder(newTasks);
    }
    dragItem.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="flex items-end justify-between px-7 pt-5 pb-0 flex-shrink-0">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "var(--muted)" }}>
            Good {tod}, {firstName}
          </p>
          <h1 className="text-3xl font-light leading-tight tracking-tight" style={{ fontFamily: "'Fraunces', serif", color: "var(--ink)" }}>
            {cfg.title}{" "}
            <span className="italic font-light" style={{ color: "var(--muted)", fontSize: "1.5rem" }}>{cfg.sub}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Export button */}
          <div className="relative">
            <button onClick={() => setShowExport(v => !v)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "var(--cream2)", color: "var(--muted)", border: "1px solid var(--cream3)" }}
              title="Export tasks">
              <Download size={13} />
            </button>
            {showExport && (
              <div className="absolute right-0 top-11 rounded-xl shadow-xl z-50 overflow-hidden animate-pop-in"
                style={{ background: "white", border: "1px solid var(--cream3)", width: 140 }}>
                <button onClick={() => { onExport("csv"); setShowExport(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-cream2 transition-colors"
                  style={{ color: "var(--ink)" }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--cream2)"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "white"}>
                  📊 Export CSV
                </button>
                <button onClick={() => { onExport("json"); setShowExport(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-medium transition-colors"
                  style={{ color: "var(--ink)" }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--cream2)"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "white"}>
                  📄 Export JSON
                </button>
              </div>
            )}
          </div>

          <div className="flex rounded-lg p-0.5 gap-0.5" style={{ background: "var(--cream2)" }}>
            {(["list", "board"] as ListMode[]).map(m => (
              <button key={m} onClick={() => setListMode(m)}
                className="px-2.5 py-1.5 rounded-md text-xs transition-all flex items-center"
                style={{
                  background: listMode === m ? "white" : "transparent",
                  color: listMode === m ? "var(--ink)" : "var(--muted)",
                  boxShadow: listMode === m ? "0 1px 4px rgba(15,14,12,0.08)" : "none",
                }}>
                {m === "list" ? <LayoutList size={14} /> : <LayoutGrid size={14} />}
              </button>
            ))}
          </div>
          <button
            onClick={onOpenPomo}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold transition-all"
            style={{ background: "var(--ink)", color: "var(--gold3)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--ink2)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--ink)"}>
            <Timer size={13} /> Focus
          </button>
        </div>
      </div>

      {/* Filters + Progress */}
      {!isCompleted && view !== "search" && (
        <div className="px-7 pt-3 flex-shrink-0">
          <div className="flex gap-1.5 flex-wrap mb-3">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className="h-6 px-3 rounded-full text-xs font-semibold transition-all"
                style={{
                  border: "1.5px solid",
                  borderColor: filter === f.key ? "transparent" : "var(--cream3)",
                  background: filter === f.key
                    ? (f.key === "high" ? "var(--ruby)" : f.key === "medium" ? "var(--amber)" : f.key === "low" ? "var(--jade)" : "var(--ink)")
                    : "transparent",
                  color: filter === f.key
                    ? (["high","medium","low"].includes(f.key) ? "white" : "var(--gold3)")
                    : "var(--muted)",
                }}>
                {f.label}
              </button>
            ))}
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1" style={{ color: "var(--muted)" }}>
              <span>Daily Progress</span>
              <span className="font-mono">{pct}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--cream3)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--gold), var(--gold2))" }} />
            </div>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mx-7 mt-3 rounded-xl px-4 py-2.5 flex items-center gap-3 animate-fade-in flex-shrink-0"
          style={{ background: "var(--gold4)", border: "1px solid rgba(196,154,42,0.3)" }}>
          <span className="text-xs font-semibold" style={{ color: "var(--gold)" }}>{selected.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => { onBulkComplete(Array.from(selected)); clearSelected(); }}
              className="h-6 px-3 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "var(--jade)", color: "white" }}>
              ✓ Complete All
            </button>
            <button onClick={() => { onBulkDelete(Array.from(selected)); clearSelected(); }}
              className="h-6 px-3 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "var(--ruby)", color: "white" }}>
              🗑 Delete All
            </button>
            <button onClick={clearSelected}
              className="h-6 px-3 rounded-lg text-xs font-semibold"
              style={{ background: "var(--cream3)", color: "var(--muted)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Task scroll area */}
      <div className="flex-1 overflow-y-auto px-7 py-4">
        {!isCompleted && view !== "search" && <AddTaskForm onAdd={onAdd} />}

        {listMode === "board" ? (
          <BoardView tasks={tasks} />
        ) : (
          <>
            {tasks.length === 0 ? (
              <EmptyState view={view} />
            ) : (
              <div className="flex flex-col gap-1">
                {(isCompleted || view === "all") && <SectionLabel label={isCompleted ? "Completed Tasks" : "Active"} />}
                {!isCompleted && view !== "all" && view !== "search" && <SectionLabel label="Active" />}
                {tasks.map((t, i) => (
                  <div key={t.id}
                    draggable={!isCompleted}
                    onDragStart={() => handleDragStart(i)}
                    onDragEnter={() => handleDragEnter(i)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => e.preventDefault()}
                    style={{
                      opacity: dragIndex === i ? 0.5 : 1,
                      borderTop: dragOverIndex === i && dragIndex !== i ? "2px solid var(--gold2)" : undefined,
                    }}
                    onClick={e => { if ((e.target as HTMLElement).closest("[data-select]")) return; }}
                  >
                    <div className="flex items-start gap-2">
                      {/* Select checkbox */}
                      <button data-select
                        onClick={e => { e.stopPropagation(); toggleSelect(t.id); }}
                        className="mt-3.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all"
                        style={{
                          border: `1.5px solid ${selected.has(t.id) ? "var(--gold2)" : "var(--cream3)"}`,
                          background: selected.has(t.id) ? "var(--gold2)" : "transparent",
                        }}>
                        {selected.has(t.id) && <span style={{ color: "white", fontSize: 9 }}>✓</span>}
                      </button>
                      <div className="flex-1">
                        <TaskItem task={t}
                          onComplete={onComplete} onReopen={onReopen}
                          onDelete={onDelete} onUpdate={onUpdate} onStartPomo={onStartPomo}
                          isDragging={dragIndex === i}
                          dragHandleProps={{ draggable: false }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Completed section in "all" view */}
            {view === "all" && allCompleted.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => setShowCompletedInAll(v => !v)}
                  className="flex items-center gap-2 py-2 text-xs font-semibold transition-colors w-full"
                  style={{ color: "var(--muted)" }}>
                  {showCompletedInAll ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  Completed ({allCompleted.length})
                  <span className="flex-1 h-px ml-2" style={{ background: "var(--cream3)" }} />
                </button>
                {showCompletedInAll && (
                  <div className="flex flex-col gap-1 mt-1">
                    {allCompleted.map(t => (
                      <TaskItem key={t.id} task={t}
                        onComplete={onComplete} onReopen={onReopen}
                        onDelete={onDelete} onUpdate={onUpdate} onStartPomo={onStartPomo} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-1">
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--ghost)", fontSize: 10 }}>{label}</span>
      <span className="flex-1 h-px" style={{ background: "var(--cream3)" }} />
    </div>
  );
}

function EmptyState({ view }: { view: View }) {
  const msgs: Partial<Record<View, { g: string; t: string; s: string }>> = {
    completed: { g: "✓", t: "Nothing completed yet.", s: "Complete your first task to see it here." },
    upcoming:  { g: "◇", t: "No reminders set.",      s: "Add a reminder time to a task to see it here." },
    search:    { g: "◎", t: "No results found.",       s: "Try a different search term." },
  };
  const m = msgs[view] || { g: "✦", t: "A clear mind awaits.", s: "Add a task above to begin your session." };
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-3 font-light italic" style={{ fontFamily: "'Fraunces', serif", color: "var(--cream3)" }}>{m.g}</div>
      <div className="text-xl font-light italic mb-2" style={{ fontFamily: "'Fraunces', serif", color: "var(--muted)" }}>{m.t}</div>
      <div className="text-xs" style={{ color: "var(--ghost)" }}>{m.s}</div>
    </div>
  );
}

function BoardView({ tasks }: { tasks: Task[] }) {
  const high = tasks.filter(t => t.priority === "high");
  const med  = tasks.filter(t => t.priority === "medium");
  const low  = tasks.filter(t => t.priority === "low");
  const col = (items: Task[], label: string, color: string) => (
    <div className="flex-1 rounded-xl p-3" style={{ background: "var(--cream2)", border: "1px solid var(--cream3)", borderTop: `3px solid ${color}` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color, fontSize: 10 }}>{label}</span>
        <span className="font-mono text-xs px-2 py-0.5 rounded-full" style={{ background: "white", border: "1px solid var(--cream3)", color: "var(--muted)", fontSize: 9 }}>{items.length}</span>
      </div>
      {items.length === 0
        ? <p className="text-xs text-center py-4" style={{ color: "var(--ghost)" }}>Empty</p>
        : items.map(t => {
          const tagList = t.tags ? t.tags.split(",").filter(Boolean) : [];
          return (
            <div key={t.id} className="rounded-lg p-2.5 mb-1.5 relative overflow-hidden" style={{ background: "white", border: "1px solid var(--cream3)", borderLeft: `3px solid ${color}` }}>
              <p className="text-xs font-medium mb-1.5 leading-snug" style={{ color: t.status === "completed" ? "var(--muted)" : "var(--ink)", textDecoration: t.status === "completed" ? "line-through" : "none" }}>{t.title}</p>
              <div className="flex gap-1 flex-wrap items-center">
                <span className="font-mono text-xs px-1.5 py-0.5 rounded-full" style={{ fontSize: 9, background: t.priority === "high" ? "var(--ruby2)" : t.priority === "medium" ? "var(--amber2)" : "var(--jade2)", color: t.priority === "high" ? "var(--ruby)" : t.priority === "medium" ? "var(--amber)" : "var(--jade)" }}>{t.priority}</span>
                <span className="font-mono text-xs px-1.5 py-0.5 rounded-full" style={{ fontSize: 9, background: "rgba(37,99,184,0.1)", color: "var(--cobalt)" }}>⏱ {t.pomoDuration}m</span>
                {t.dueDate && <span className="font-mono text-xs" style={{ fontSize: 9, color: "var(--muted)" }}>📅 {t.dueDate}</span>}
                {tagList.slice(0, 2).map(tg => <span key={tg} className="font-mono text-xs px-1 py-0.5 rounded" style={{ fontSize: 8, background: "var(--gold4)", color: "var(--gold)" }}>#{tg}</span>)}
                {t.reminderTime && <span className="font-mono text-xs" style={{ fontSize: 9, color: "var(--muted)" }}>⏰ {t.reminderTime}</span>}
              </div>
            </div>
          );
        })
      }
    </div>
  );
  return (
    <div className="flex gap-3 mt-2">
      {col(high, "High", "var(--ruby)")}
      {col(med, "Medium", "var(--amber)")}
      {col(low, "Low", "var(--jade)")}
    </div>
  );
}
