"use client";
import { getInitials, getLevelInfo } from "@/lib/auth";
import type { View, UserData } from "./DashboardClient";
import { LogOut, Timer, Moon, Sun, Search } from "lucide-react";

interface Props {
  user: UserData; view: View; setView: (v: View) => void;
  activeCounts: Record<string, number>;
  onLogout: () => void; onOpenPomo: () => void;
  darkMode: boolean; onToggleDark: () => void;
  searchQuery: string; onSearchChange: (q: string) => void;
}

const NAV_ITEMS: { view: View; icon: string; label: string; countKey?: string }[] = [
  { view: "today",    icon: "◆", label: "Today",         countKey: "today" },
  { view: "upcoming", icon: "◇", label: "Upcoming",      countKey: "upcoming" },
  { view: "all",      icon: "▦", label: "All Tasks",     countKey: "all" },
  { view: "completed",icon: "✓", label: "Completed",     countKey: "completed" },
  { view: "stats",    icon: "◈", label: "Stats & Awards" },
];
const PRIORITY_ITEMS: { view: View; label: string; color: string; countKey: string }[] = [
  { view: "high",   label: "High Priority",   color: "var(--ruby)",  countKey: "high" },
  { view: "medium", label: "Medium Priority", color: "var(--amber)", countKey: "medium" },
  { view: "low",    label: "Low Priority",    color: "var(--jade)",  countKey: "low" },
];

export default function Sidebar({ user, view, setView, activeCounts, onLogout, onOpenPomo, darkMode, onToggleDark, searchQuery, onSearchChange }: Props) {
  const lvInfo = getLevelInfo(user.xp);
  const pct = Math.min(100, (lvInfo.cur / lvInfo.need) * 100);

  return (
    <aside className="flex flex-col flex-shrink-0 overflow-hidden" style={{ width: 260, background: "var(--ink)" }}>
      {/* Ambient bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ width: 260, height: 200, background: "radial-gradient(ellipse at 50% 100%, rgba(196,154,42,0.1), transparent 70%)" }} />

      {/* Brand + User */}
      <div className="px-5 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-light italic"
              style={{ fontFamily: "'Fraunces', serif", background: "rgba(196,154,42,0.15)", border: "1px solid rgba(196,154,42,0.3)", color: "var(--gold2)" }}>A</div>
            <span className="text-lg font-light" style={{ fontFamily: "'Fraunces', serif", color: "rgba(255,255,255,0.9)", letterSpacing: "-0.3px" }}>Apex</span>
          </div>
          {/* Dark mode toggle */}
          <button onClick={onToggleDark}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLElement).style.color = "var(--gold2)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.25)" }} />
          <input
            value={searchQuery}
            onChange={e => { onSearchChange(e.target.value); if (e.target.value) setView("search"); else setView("today"); }}
            onFocus={() => { if (searchQuery) setView("search"); }}
            placeholder="Search tasks…"
            className="w-full rounded-lg pl-8 pr-3 py-2 text-xs outline-none transition-all"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontFamily: "'Outfit', sans-serif" }}
            onFocus2={e => (e.target as HTMLElement).style.borderColor = "rgba(196,154,42,0.4)"}
          />
        </div>

        <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: user.avatarColor, color: "var(--ink)" }}>
              {getInitials(user.name)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: "rgba(255,255,255,0.88)" }}>{user.name}</div>
              <div className="text-xs truncate font-mono" style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{user.email}</div>
            </div>
          </div>
        </div>
      </div>

      {/* XP Bar */}
      <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex justify-between items-center mb-2">
          <span className="font-mono text-xs font-medium" style={{ color: "var(--gold2)", fontSize: 11 }}>LV {lvInfo.lv}</span>
          <span className="font-mono text-xs" style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>{lvInfo.cur} / {lvInfo.need} XP</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--gold), var(--gold2))" }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="font-mono text-xs" style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>🔥 {user.streak} day streak</span>
          <span className="font-mono text-xs" style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>✓ {user.completedCount} done</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        <p className="px-2 mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.18)", fontSize: 9 }}>Smart Views</p>
        {NAV_ITEMS.map(item => (
          <NavItem key={item.view} icon={item.icon} label={item.label} active={view === item.view}
            count={item.countKey !== undefined ? activeCounts[item.countKey] : undefined}
            onClick={() => setView(item.view)} />
        ))}

        <p className="px-2 mt-3 mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.18)", fontSize: 9 }}>Priority</p>
        {PRIORITY_ITEMS.map(item => (
          <NavItem key={item.view} icon="●" iconColor={item.color} label={item.label} active={view === item.view}
            count={activeCounts[item.countKey]} onClick={() => setView(item.view)} />
        ))}

        <p className="px-2 mt-3 mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.18)", fontSize: 9 }}>Tools</p>
        <button onClick={onOpenPomo} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all mb-0.5"
          style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}>
          <Timer size={14} className="flex-shrink-0" />
          Focus Timer
        </button>
      </nav>

      {/* Bottom */}
      <div className="px-2.5 py-3 relative z-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all"
          style={{ color: "rgba(255,255,255,0.3)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(192,57,43,0.1)"; (e.currentTarget as HTMLElement).style.color = "rgba(220,100,90,0.9)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)"; }}>
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </aside>
  );
}

function NavItem({ icon, iconColor, label, active, count, onClick }: { icon: string; iconColor?: string; label: string; active: boolean; count?: number; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all mb-0.5 relative"
      style={{ background: active ? "rgba(196,154,42,0.14)" : "transparent", color: active ? "var(--gold2)" : "rgba(255,255,255,0.4)" }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)"; } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; } }}>
      {active && <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 rounded-r" style={{ background: "var(--gold2)" }} />}
      <span className="w-4 text-center text-xs flex-shrink-0" style={{ color: iconColor || "inherit" }}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && (
        <span className="font-mono text-xs px-1.5 py-0.5 rounded-full" style={{ background: active ? "rgba(196,154,42,0.2)" : "rgba(255,255,255,0.08)", color: active ? "var(--gold2)" : "rgba(255,255,255,0.3)", fontSize: 9 }}>{count}</span>
      )}
    </button>
  );
}
