"use client";
import { useState, useEffect, useRef } from "react";
import type { Task } from "@/types";
import { X, SkipForward, RotateCcw } from "lucide-react";

interface Props {
  open: boolean; onClose: () => void;
  task: Task | null; onClearTask: () => void;
  onPomoComplete: (mins: number) => void;
  totalPomos: number; totalMins: number;
}
type Mode = "focus" | "short" | "long";
const MODE_MINS: Record<Mode, number> = { focus: 25, short: 5, long: 15 };
const MODES: { key: Mode; label: string }[] = [{ key: "focus", label: "Focus" }, { key: "short", label: "Short Break" }, { key: "long", label: "Long" }];

// Ambient audio using Web Audio API (no external files needed)
function createAmbientNode(ctx: AudioContext, type: "rain" | "fire" | "cafe") {
  const nodes: AudioNode[] = [];
  if (type === "rain") {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const filt = ctx.createBiquadFilter(); filt.type = "bandpass"; filt.frequency.value = 800; filt.Q.value = 0.3;
    const gain = ctx.createGain(); gain.gain.value = 0.4;
    src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
    src.start(); nodes.push(src, filt, gain);
  } else if (type === "fire") {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.08;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const filt = ctx.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 300;
    const gain = ctx.createGain(); gain.gain.value = 0.35;
    src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
    src.start(); nodes.push(src, filt, gain);
  } else {
    // cafe: low hum + noise
    const osc = ctx.createOscillator(); osc.frequency.value = 60; osc.type = "sine";
    const g1 = ctx.createGain(); g1.gain.value = 0.04;
    osc.connect(g1); g1.connect(ctx.destination);
    osc.start();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.05;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const g2 = ctx.createGain(); g2.gain.value = 0.15;
    src.connect(g2); g2.connect(ctx.destination);
    src.start(); nodes.push(osc, g1, src, g2);
  }
  return nodes;
}

export default function PomoDrawer({ open, onClose, task, onClearTask, onPomoComplete, totalPomos, totalMins }: Props) {
  const [mode, setMode] = useState<Mode>("focus");
  const [mins, setMins] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [todayPomos, setTodayPomos] = useState(0);
  const [ambActive, setAmbActive] = useState<"rain" | "fire" | "cafe" | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const totalRef = useRef(25 * 60);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambNodesRef = useRef<AudioNode[]>([]);

  const stopAmb = () => {
    ambNodesRef.current.forEach(n => { try { (n as any).stop?.(); (n as any).disconnect?.(); } catch {} });
    ambNodesRef.current = [];
  };

  const toggleAmb = (k: "rain" | "fire" | "cafe") => {
    if (ambActive === k) {
      stopAmb();
      setAmbActive(null);
      return;
    }
    stopAmb();
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
      ambNodesRef.current = createAmbientNode(audioCtxRef.current, k);
      setAmbActive(k);
    } catch { setAmbActive(null); }
  };

  useEffect(() => () => { stopAmb(); clearInterval(intervalRef.current); }, []);

  const setModeAndReset = (m: Mode, customMins?: number) => {
    clearInterval(intervalRef.current);
    setRunning(false);
    const newMins = customMins || MODE_MINS[m];
    setMode(m); setMins(newMins);
    const secs = newMins * 60;
    totalRef.current = secs;
    setRemaining(secs);
  };

  useEffect(() => {
    if (task && mode === "focus") setModeAndReset("focus", task.pomoDuration);
  }, [task?.id]);

  const toggle = () => {
    if (running) { clearInterval(intervalRef.current); setRunning(false); return; }
    setRunning(true);
    let rem = remaining;
    intervalRef.current = setInterval(() => {
      rem--;
      setRemaining(rem);
      if (rem <= 0) {
        clearInterval(intervalRef.current);
        setRunning(false);
        if (mode === "focus") {
          const newSessions = Math.min(4, sessions + 1);
          setSessions(newSessions);
          setTodayPomos(p => p + 1);
          onPomoComplete(mins);
          setTimeout(() => setModeAndReset(newSessions >= 4 ? "long" : "short"), 600);
        } else {
          setTimeout(() => setModeAndReset("focus", task?.pomoDuration), 600);
        }
      }
    }, 1000);
  };

  const skipCurrent = () => {
    clearInterval(intervalRef.current); setRunning(false);
    if (mode === "focus") {
      const ns = Math.min(4, sessions + 1); setSessions(ns);
      onPomoComplete(mins); setTodayPomos(p => p + 1);
      setModeAndReset(ns >= 4 ? "long" : "short");
    } else setModeAndReset("focus", task?.pomoDuration);
  };

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const displayTime = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  const pct = remaining / totalRef.current;
  const circ = 2 * Math.PI * 78;
  const offset = circ * (1 - pct);
  const strokeColor = mode === "focus" ? "url(#pg)" : "url(#gg)";

  // Update document title when running
  useEffect(() => {
    if (running) document.title = `${displayTime} · ${mode === "focus" ? "Focus" : "Break"} — Apex`;
    else document.title = "Apex — Task Mastery";
    return () => { document.title = "Apex — Task Mastery"; };
  }, [running, displayTime, mode]);

  return (
    <div className="flex-shrink-0 overflow-hidden transition-all duration-300"
      style={{ width: open ? 288 : 0, background: "white", borderLeft: "1px solid var(--cream3)" }}>
      {open && (
        <div className="flex flex-col h-full overflow-y-auto" style={{ width: 288 }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3.5 flex-shrink-0" style={{ borderBottom: "1px solid var(--cream3)" }}>
            <h2 className="text-lg font-light italic" style={{ fontFamily: "'Fraunces', serif", color: "var(--ink)" }}>Focus Session</h2>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors"
              style={{ background: "var(--cream2)", color: "var(--muted)", border: "1px solid var(--cream3)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--ink)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--muted)"}>
              <X size={14} />
            </button>
          </div>

          {/* Task chip */}
          <div className="px-5 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--cream3)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--ghost)", fontSize: 10 }}>Current Task</p>
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "var(--cream)", border: "1px solid var(--cream3)" }}>
              <span className="text-xs font-medium truncate flex-1" style={{ color: "var(--ink3)" }}>
                {task ? task.title : "No task selected"}
              </span>
              {task && <button onClick={onClearTask} className="text-xs flex-shrink-0 transition-colors" style={{ color: "var(--ghost)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--ruby)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--ghost)"}>✕</button>}
            </div>
          </div>

          {/* Ring timer */}
          <div className="flex items-center justify-center py-5 relative flex-shrink-0">
            <svg width="190" height="190" viewBox="0 0 190 190" style={{ overflow: "visible" }}>
              <defs>
                <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c49a2a" /><stop offset="100%" stopColor="#e0b340" />
                </linearGradient>
                <linearGradient id="gg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1a8a4a" /><stop offset="100%" stopColor="#27ae60" />
                </linearGradient>
              </defs>
              <circle cx="95" cy="95" r="78" fill="none" stroke="var(--cream2)" strokeWidth="7" transform="rotate(-90 95 95)" />
              <circle cx="95" cy="95" r="78" fill="none" stroke={strokeColor} strokeWidth="7"
                strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                style={{ transition: running ? "stroke-dashoffset 1s linear" : "none" }}
                transform="rotate(-90 95 95)" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-mono text-4xl font-light tracking-tighter" style={{ color: "var(--ink)", letterSpacing: "-2px" }}>{displayTime}</div>
              <div className="text-xs font-semibold uppercase tracking-widest mt-1.5" style={{ color: "var(--muted)", fontSize: 10 }}>
                {mode === "focus" ? "Focus" : mode === "short" ? "Short Break" : "Long Break"}
              </div>
            </div>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 px-5 mb-3 flex-shrink-0">
            {MODES.map(({ key, label }) => (
              <button key={key} onClick={() => setModeAndReset(key)}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all tracking-wide"
                style={{
                  border: "1.5px solid", borderColor: mode === key ? "var(--gold2)" : "transparent",
                  background: mode === key ? "var(--gold4)" : "var(--cream)",
                  color: mode === key ? "var(--gold)" : "var(--muted)",
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2.5 px-5 pb-4 flex-shrink-0">
            <CtrlBtn icon={<RotateCcw size={14} />} title="Reset" onClick={() => { clearInterval(intervalRef.current); setRunning(false); setRemaining(totalRef.current); }} />
            <button onClick={toggle}
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg transition-all"
              style={{ background: "var(--ink)", color: "var(--gold3)", boxShadow: "0 4px 16px rgba(15,14,12,0.18)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--ink2)"; (e.currentTarget as HTMLElement).style.transform = "scale(1.04)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--ink)"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}>
              {running ? "⏸" : "▶"}
            </button>
            <CtrlBtn icon={<SkipForward size={14} />} title="Skip" onClick={skipCurrent} />
          </div>

          {/* Session dots */}
          <div className="flex justify-center gap-1.5 pb-3 flex-shrink-0">
            {[0,1,2,3].map(i => (
              <div key={i} className="w-2 h-2 rounded-full transition-all" style={{ background: i < sessions ? "var(--gold2)" : "var(--cream3)", border: `1px solid ${i < sessions ? "var(--gold)" : "var(--cream4)"}`, boxShadow: i < sessions ? "0 0 5px rgba(196,154,42,0.4)" : "none" }} />
            ))}
          </div>

          {/* Mini stats */}
          <div className="mx-5 rounded-xl flex mb-4 flex-shrink-0" style={{ background: "var(--cream)", border: "1px solid var(--cream3)" }}>
            {[["Today", todayPomos], ["Total", totalPomos], ["Mins", totalMins]].map(([l, v], i) => (
              <div key={l as string} className={`flex-1 text-center py-3 ${i > 0 ? "border-l" : ""}`} style={{ borderColor: "var(--cream3)" }}>
                <div className="text-xl font-light italic" style={{ fontFamily: "'Fraunces', serif", color: "var(--gold)" }}>{v}</div>
                <div className="text-xs font-semibold uppercase tracking-wider mt-0.5" style={{ color: "var(--ghost)", fontSize: 9 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Ambient */}
          <div className="px-5 pb-6 flex-shrink-0">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--ghost)", fontSize: 10 }}>Ambient Sound</p>
            <div className="flex gap-1.5">
              {(["rain", "fire", "cafe"] as const).map((k, idx) => (
                <button key={k} onClick={() => toggleAmb(k)}
                  className="flex-1 py-2 rounded-lg text-base transition-all"
                  style={{ border: "1.5px solid", borderColor: ambActive === k ? "var(--gold2)" : "var(--cream3)", background: ambActive === k ? "var(--gold4)" : "var(--cream)" }}
                  title={k.charAt(0).toUpperCase() + k.slice(1)}>
                  {["🌧","🔥","☕"][idx]}
                </button>
              ))}
              <button onClick={() => { stopAmb(); setAmbActive(null); }} className="flex-1 py-2 rounded-lg text-xs font-bold transition-all tracking-wider"
                style={{ border: "1.5px solid", borderColor: "var(--cream3)", background: "var(--cream)", color: "var(--muted)" }}>
                OFF
              </button>
            </div>
            {ambActive && <p className="text-xs mt-2 text-center" style={{ color: "var(--ghost)" }}>🎵 {ambActive} playing</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function CtrlBtn({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button title={title} onClick={onClick}
      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
      style={{ background: "var(--cream2)", color: "var(--muted)", border: "1px solid var(--cream3)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--cream3)"; (e.currentTarget as HTMLElement).style.color = "var(--ink)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--cream2)"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}>
      {icon}
    </button>
  );
}
