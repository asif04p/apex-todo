"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Task } from "@/types";
import Sidebar from "./Sidebar";
import TaskList from "./TaskList";
import PomoDrawer from "./PomoDrawer";
import RewardModal from "./RewardModal";
import ToastNotification from "../ui/ToastNotification";
import StatsView from "./StatsView";
import { getInitials, getLevelInfo } from "@/lib/auth";

export type View = "today" | "upcoming" | "all" | "completed" | "high" | "medium" | "low" | "stats" | "search";
export type Filter = "all" | "high" | "medium" | "low" | "reminder" | "due" | "tagged";
export type ListMode = "list" | "board";

export interface UserData {
  id: string; name: string; email: string; avatarColor: string;
  xp: number; level: number; levelInfo: { lv: number; cur: number; need: number };
  streak: number; completedCount: number; pomosTotal: number; minutesFocused: number;
}

interface Toast { id: number; icon: string; title: string; body: string; }
interface Reward { emoji: string; headline: string; message: string; xpGained: number; achievement?: { emoji: string; name: string; desc: string } | null; }

// Keyboard shortcut handler
function useKeyShortcuts(handlers: Record<string, () => void>) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      if (handlers[k]) { e.preventDefault(); handlers[k](); }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [handlers]);
}

export default function DashboardClient({ initialUser, initialTasks }: { initialUser: UserData; initialTasks: Task[] }) {
  const router = useRouter();
  const [user, setUser] = useState<UserData>(initialUser);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [view, setView] = useState<View>("today");
  const [filter, setFilter] = useState<Filter>("all");
  const [listMode, setListMode] = useState<ListMode>("list");
  const [pomoOpen, setPomoOpen] = useState(false);
  const [pomoTaskId, setPomoTaskId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [reward, setReward] = useState<Reward | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const confettiRef = useRef<HTMLCanvasElement>(null);
  const reminderCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Dark mode persistence
  useEffect(() => {
    const saved = localStorage.getItem("apex-dark");
    if (saved === "1") setDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("apex-dark", darkMode ? "1" : "0");
    if (darkMode) {
      document.documentElement.style.setProperty("--cream", "#1a1917");
      document.documentElement.style.setProperty("--cream2", "#222120");
      document.documentElement.style.setProperty("--cream3", "#2e2c29");
      document.documentElement.style.setProperty("--cream4", "#3a3835");
      document.documentElement.style.setProperty("--ink", "#f0ece4");
      document.documentElement.style.setProperty("--ink2", "#e0dbd2");
      document.documentElement.style.setProperty("--ink3", "#c8c3ba");
      document.documentElement.style.setProperty("--muted", "#9b9590");
      document.documentElement.style.setProperty("--faint", "#6a6560");
      document.documentElement.style.setProperty("--ghost", "#4a4845");
      document.documentElement.style.setProperty("--gold4", "#2a2415");
    } else {
      document.documentElement.style.setProperty("--cream", "#faf7f2");
      document.documentElement.style.setProperty("--cream2", "#f3ede4");
      document.documentElement.style.setProperty("--cream3", "#e9e1d5");
      document.documentElement.style.setProperty("--cream4", "#ddd5c7");
      document.documentElement.style.setProperty("--ink", "#0f0e0c");
      document.documentElement.style.setProperty("--ink2", "#1e1c19");
      document.documentElement.style.setProperty("--ink3", "#2e2b26");
      document.documentElement.style.setProperty("--muted", "#8c8479");
      document.documentElement.style.setProperty("--faint", "#b5aea5");
      document.documentElement.style.setProperty("--ghost", "#d4cdc6");
      document.documentElement.style.setProperty("--gold4", "#fdf3d8");
    }
  }, [darkMode]);

  const addToast = useCallback((icon: string, title: string, body: string) => {
    const id = Date.now();
    setToasts(t => [...t, { id, icon, title, body }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  }, []);

  // Reminder checker
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const t = `${hh}:${mm}`;
      tasks.filter(tk => tk.status === "active" && tk.reminderTime === t).forEach(tk => {
        addToast("🔔", "Reminder", `"${tk.title.slice(0, 35)}" is due now.`);
      });
    };
    check();
    reminderCheckRef.current = setInterval(check, 60000);
    return () => { if (reminderCheckRef.current) clearInterval(reminderCheckRef.current); };
  }, [tasks, addToast]);

  // Keyboard shortcuts
  useKeyShortcuts(useCallback(() => ({
    "n": () => { setView("today"); setTimeout(() => document.querySelector<HTMLElement>(".add-task-input")?.focus(), 100); },
    "f": () => setPomoOpen(v => !v),
    "1": () => setView("today"),
    "2": () => setView("upcoming"),
    "3": () => setView("all"),
    "4": () => setView("completed"),
    "5": () => setView("stats"),
    "/": () => { setView("search"); setTimeout(() => document.querySelector<HTMLElement>(".search-input")?.focus(), 100); },
    "escape": () => { setPomoOpen(false); setShowReward(false); },
  }), []) as any);

  const handleCompleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      const data = await res.json();
      if (!data.success) { addToast("❌", "Error", data.error || "Failed to complete task."); return; }

      setTasks(prev => {
        let updated = prev.map(t => t.id === taskId ? { ...t, status: "completed" as const, completedAt: Date.now() } : t);
        if (data.data.newRecurringTask) updated = [data.data.newRecurringTask, ...updated];
        return updated;
      });
      const newLvInfo = getLevelInfo(data.data.user.xp);
      setUser(prev => ({ ...prev, xp: data.data.user.xp, level: data.data.user.level, levelInfo: newLvInfo, completedCount: data.data.user.completedCount, streak: data.data.user.streak }));

      const cheers = [
        { e: "🏆", h: "Masterfully done." }, { e: "⚡", h: "Electrifying." },
        { e: "🎯", h: "Bullseye. Perfect." }, { e: "🔥", h: "Absolutely blazing." },
        { e: "💎", h: "Diamond focus." }, { e: "🚀", h: "Into orbit." },
        { e: "✨", h: "Brilliant." }, { e: "🌿", h: "Effortless flow." },
      ];
      const msgs = [
        "One step closer to where you want to be.",
        "Legends are built one deliberate action at a time.",
        "Momentum is yours. Ride it into the next task.",
        "Discipline bridges goals and accomplishment.",
        "Progress, not perfection. This was progress.",
        "Small wins compound into grand achievements.",
        "Your future self thanks you.",
      ];
      const c = cheers[Math.floor(Math.random() * cheers.length)];
      setReward({ emoji: c.e, headline: c.h, message: msgs[Math.floor(Math.random() * msgs.length)], xpGained: data.data.xpGained, achievement: null });
      setShowReward(true);
      launchConfetti();
      if (data.data.newRecurringTask) addToast("↻", "Recurring task", "New instance created automatically.");
    } catch { addToast("❌", "Error", "Network error."); }
  };

  const handleReopenTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "active" }) });
      const data = await res.json();
      if (data.success) { setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "active", completedAt: null } : t)); addToast("↩️", "Reopened", "Task moved back to active."); }
    } catch { addToast("❌", "Error", "Network error."); }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { setTasks(prev => prev.filter(t => t.id !== taskId)); if (pomoTaskId === taskId) setPomoTaskId(null); addToast("🗑", "Deleted", "Task removed."); }
    } catch { addToast("❌", "Error", "Network error."); }
  };

  const handleAddTask = async (input: any) => {
    try {
      const res = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const data = await res.json();
      if (data.success) { setTasks(prev => [data.data, ...prev]); addToast("✦", "Task added", `"${input.title.slice(0, 30)}" is ready.`); }
      else addToast("❌", "Error", data.error || "Failed to add task.");
    } catch { addToast("❌", "Error", "Network error."); }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
      const data = await res.json();
      if (data.success) setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates, updatedAt: Date.now() } : t));
    } catch {}
  };

  const handlePomoComplete = async (mins: number) => {
    try {
      const res = await fetch("/api/user", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completedPomo: true, minutesFocused: mins }) });
      const data = await res.json();
      if (data.success) setUser(prev => ({ ...prev, pomosTotal: data.data.pomosTotal, minutesFocused: data.data.minutesFocused }));
    } catch {}
    addToast("🍅", "Focus complete!", `${mins}m session done. Take a break.`);
  };

  const handleBulkComplete = async (ids: string[]) => {
    for (const id of ids) await handleCompleteTask(id);
    addToast("✓", "Bulk complete", `${ids.length} tasks completed.`);
  };

  const handleBulkDelete = async (ids: string[]) => {
    for (const id of ids) await handleDeleteTask(id);
  };

  const handleReorder = (reordered: Task[]) => {
    setTasks(prev => {
      const otherTasks = prev.filter(t => !reordered.find(r => r.id === t.id));
      return [...reordered, ...otherTasks];
    });
  };

  const handleExport = async (format: "csv" | "json") => {
    try {
      const res = await fetch("/api/user", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ format }) });
      if (format === "csv") {
        const text = await res.text();
        const blob = new Blob([text], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "apex-tasks.csv"; a.click();
        URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "apex-tasks.json"; a.click();
        URL.revokeObjectURL(url);
      }
      addToast("📤", "Exported", `Tasks exported as ${format.toUpperCase()}.`);
    } catch { addToast("❌", "Error", "Export failed."); }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login"); router.refresh();
  };

  function launchConfetti() {
    const cv = confettiRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    const cols = ["#c49a2a","#e0b340","#f5d78a","#1a8a4a","#c0392b","#f0ece4","#2563b8","#e07bb5"];
    const parts = Array.from({ length: 90 }, () => ({
      x: Math.random() * cv.width, y: -15 - Math.random() * 80,
      vx: (Math.random() - .5) * 5, vy: 2.5 + Math.random() * 3.5,
      sz: 5 + Math.random() * 5,
      col: cols[Math.floor(Math.random() * cols.length)],
      rot: Math.random() * 360, rv: (Math.random() - .5) * 8,
      a: 1, circ: Math.random() > .5,
    }));
    let f = 0;
    const draw = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      parts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += p.rv;
        if (f > 55) p.a = Math.max(0, p.a - .013);
        ctx.save(); ctx.globalAlpha = p.a;
        ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.col;
        if (p.circ) { ctx.beginPath(); ctx.arc(0, 0, p.sz / 2, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.sz / 2, -p.sz * .35, p.sz, p.sz * .7);
        ctx.restore();
      });
      f++;
      if (f < 130) requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, cv.width, cv.height);
    };
    draw();
  }

  const activeTasks = tasks.filter(t => t.status === "active");
  const completedTasks = tasks.filter(t => t.status === "completed");

  const getViewTasks = (): Task[] => {
    // Search mode
    if (view === "search" && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return tasks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q) ||
        (t.tags || "").toLowerCase().includes(q)
      );
    }

    let base = view === "completed" ? completedTasks : activeTasks;
    if (view === "high" || view === "medium" || view === "low") base = base.filter(t => t.priority === view);
    else if (view === "upcoming") base = base.filter(t => t.reminderTime).sort((a, b) => (a.reminderTime || "").localeCompare(b.reminderTime || ""));

    if (filter === "high") base = base.filter(t => t.priority === "high");
    else if (filter === "medium") base = base.filter(t => t.priority === "medium");
    else if (filter === "low") base = base.filter(t => t.priority === "low");
    else if (filter === "reminder") base = base.filter(t => t.reminderTime);
    else if (filter === "due") base = base.filter(t => t.dueDate).sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
    else if (filter === "tagged") base = base.filter(t => t.tags && t.tags.length > 0);
    return base;
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--cream)" }}>
      <canvas ref={confettiRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 1500 }} />

      <Sidebar
        user={user} view={view} setView={v => { setView(v); setFilter("all"); }}
        activeCounts={{
          today: activeTasks.length,
          upcoming: activeTasks.filter(t => t.reminderTime).length,
          all: tasks.length,
          completed: completedTasks.length,
          high: activeTasks.filter(t => t.priority === "high").length,
          medium: activeTasks.filter(t => t.priority === "medium").length,
          low: activeTasks.filter(t => t.priority === "low").length,
        }}
        onLogout={handleLogout} onOpenPomo={() => setPomoOpen(true)}
        darkMode={darkMode} onToggleDark={() => setDarkMode(v => !v)}
        searchQuery={searchQuery} onSearchChange={setSearchQuery}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {view === "stats" ? (
          <StatsView user={user} tasks={tasks} />
        ) : (
          <TaskList
            view={view} filter={filter} setFilter={setFilter}
            listMode={listMode} setListMode={setListMode}
            tasks={getViewTasks()}
            allActive={activeTasks} allCompleted={completedTasks}
            onComplete={handleCompleteTask} onReopen={handleReopenTask}
            onDelete={handleDeleteTask} onAdd={handleAddTask}
            onUpdate={handleUpdateTask}
            userName={user.name}
            onStartPomo={(id) => { setPomoTaskId(id); setPomoOpen(true); }}
            onOpenPomo={() => setPomoOpen(true)}
            onBulkComplete={handleBulkComplete}
            onBulkDelete={handleBulkDelete}
            onReorder={handleReorder}
            onExport={handleExport}
          />
        )}
      </main>

      <PomoDrawer
        open={pomoOpen} onClose={() => setPomoOpen(false)}
        task={pomoTaskId ? tasks.find(t => t.id === pomoTaskId) || null : null}
        onClearTask={() => setPomoTaskId(null)}
        onPomoComplete={handlePomoComplete}
        totalPomos={user.pomosTotal}
        totalMins={user.minutesFocused}
      />

      {showReward && reward && (
        <RewardModal reward={reward} user={user} onClose={() => setShowReward(false)} />
      )}

      <div className="fixed bottom-6 right-6 flex flex-col gap-2" style={{ zIndex: 3000 }}>
        {toasts.map(t => <ToastNotification key={t.id} icon={t.icon} title={t.title} body={t.body} />)}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-xs font-mono opacity-0 hover:opacity-100 transition-opacity"
        style={{ color: "var(--ghost)", pointerEvents: "none" }}>
        n·new  f·focus  /·search  1-5·views  esc·close
      </div>
    </div>
  );
}
