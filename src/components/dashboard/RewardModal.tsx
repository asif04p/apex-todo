"use client";
import type { UserData } from "./DashboardClient";
import { getLevelInfo } from "@/lib/auth";

interface Reward {
  emoji: string;
  headline: string;
  message: string;
  xpGained: number;
  achievement?: { emoji: string; name: string; desc: string } | null;
}

interface Props { reward: Reward; user: UserData; onClose: () => void; }

export default function RewardModal({ reward, user, onClose }: Props) {
  const lvInfo = getLevelInfo(user.xp);
  const pct = Math.min(100, (lvInfo.cur / lvInfo.need) * 100);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "rgba(15,14,12,0.55)", backdropFilter: "blur(6px)", zIndex: 2000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-3xl overflow-hidden animate-pop-in"
        style={{
          background: "var(--cream)",
          border: "1px solid var(--cream3)",
          width: 380, maxWidth: "92vw",
          boxShadow: "0 24px 80px rgba(15,14,12,0.22)",
        }}
      >
        {/* Top dark section */}
        <div className="text-center px-8 pt-8 pb-6 relative overflow-hidden" style={{ background: "var(--ink)" }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(circle at 50% 80%, rgba(196,154,42,0.18), transparent 65%)" }}
          />
          <span className="text-5xl block mb-2 animate-bounce-in relative z-10">{reward.emoji}</span>
          <h2
            className="text-2xl font-light italic relative z-10"
            style={{ fontFamily: "'Fraunces', serif", color: "var(--gold2)" }}
          >
            {reward.headline}
          </h2>
        </div>

        {/* Body */}
        <div className="px-7 py-6 text-center">
          {/* Achievement unlock */}
          {reward.achievement && (
            <div
              className="flex items-center gap-3 rounded-xl p-3 mb-4 text-left"
              style={{ background: "var(--gold4)", border: "1px solid rgba(196,154,42,0.25)" }}
            >
              <span className="text-2xl flex-shrink-0">{reward.achievement.emoji}</span>
              <div>
                <p className="text-xs font-bold mb-0.5" style={{ color: "var(--gold)" }}>Achievement Unlocked!</p>
                <p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>{reward.achievement.name}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{reward.achievement.desc}</p>
              </div>
            </div>
          )}

          <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--muted)" }}>{reward.message}</p>

          {/* XP pill */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-5 font-mono text-sm font-medium"
            style={{ background: "var(--gold4)", border: "1px solid rgba(196,154,42,0.3)", color: "var(--gold)" }}
          >
            ⚡ +{reward.xpGained} XP Earned
          </div>

          {/* Level progress */}
          <div className="mb-6">
            <div className="flex justify-between text-xs mb-2" style={{ color: "var(--muted)" }}>
              <span className="font-mono font-semibold" style={{ color: "var(--gold)" }}>LV {lvInfo.lv}</span>
              <span className="font-mono">{lvInfo.cur} / {lvInfo.need} XP</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--cream3)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, var(--gold), var(--gold2))",
                  transition: "width 1s cubic-bezier(.34,1.56,.64,1)",
                }}
              />
            </div>
          </div>

          <button onClick={onClose} className="btn-primary" style={{ borderRadius: 12 }}>
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
