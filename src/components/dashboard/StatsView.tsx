"use client";
import type { Task } from "@/types";
import type { UserData } from "./DashboardClient";
import { getLevelInfo } from "@/lib/auth";
import { ACHIEVEMENTS } from "@/types";

interface Props { user: UserData; tasks: Task[] }

export default function StatsView({ user, tasks }: Props) {
  const lvInfo = getLevelInfo(user.xp);
  const pct = Math.min(100, (lvInfo.cur / lvInfo.need) * 100);
  const completed = tasks.filter(t => t.status === "completed");
  const byPriority = (p: string) => ({
    done: completed.filter(t => t.priority === p).length,
    total: tasks.filter(t => t.priority === p).length,
  });
  const high = byPriority("high");
  const med  = byPriority("medium");
  const low  = byPriority("low");
  const recent = [...completed].sort((a,b)=>(b.completedAt||0)-(a.completedAt||0)).slice(0,7);
  const userT = { id:user.id, name:user.name, email:user.email, emailVerified:true, avatarColor:user.avatarColor, xp:user.xp, level:user.level, streak:user.streak, completedCount:user.completedCount, pomosTotal:user.pomosTotal, minutesFocused:user.minutesFocused, createdAt:0 };

  return (
    <div className="flex-1 overflow-y-auto px-7 py-6">
      <div className="rounded-2xl p-6 flex items-center gap-5 mb-4 relative overflow-hidden" style={{background:"var(--ink)"}}>
        <div className="absolute right-0 top-0 bottom-0 w-48 pointer-events-none" style={{background:"radial-gradient(ellipse at 100% 50%, rgba(196,154,42,0.12), transparent 70%)"}} />
        <span className="text-5xl flex-shrink-0">🔥</span>
        <div>
          <div className="text-5xl font-light italic leading-none mb-1" style={{fontFamily:"'Fraunces', serif",color:"var(--gold2)"}}>{user.streak}</div>
          <div className="text-sm font-medium" style={{color:"rgba(255,255,255,0.4)"}}>Day Streak</div>
        </div>
        <div className="ml-auto text-right hidden sm:block">
          <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{color:"rgba(255,255,255,0.25)"}}>Level Progress</div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs" style={{color:"var(--gold2)"}}>LV {lvInfo.lv}</span>
            <div className="w-28 h-1.5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.1)"}}>
              <div className="h-full rounded-full" style={{width:`${pct}%`,background:"linear-gradient(90deg,var(--gold),var(--gold2))"}} />
            </div>
          </div>
          <div className="font-mono text-xs" style={{color:"rgba(255,255,255,0.3)"}}>{lvInfo.cur} / {lvInfo.need} XP</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[{num:user.completedCount,label:"Completed"},{num:user.pomosTotal,label:"Pomodoros"},{num:user.xp,label:"XP Earned"},{num:user.minutesFocused,label:"Min. Focused"}].map(({num,label})=>(
          <div key={label} className="rounded-2xl p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-md" style={{background:"white",border:"1px solid var(--cream3)"}}>
            <div className="text-4xl font-light italic leading-none mb-1.5" style={{fontFamily:"'Fraunces', serif",color:"var(--gold)"}}>{num.toLocaleString()}</div>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{color:"var(--ghost)",fontSize:10}}>{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[{label:"High",color:"var(--ruby)",bg:"var(--ruby2)",data:high},{label:"Medium",color:"var(--amber)",bg:"var(--amber2)",data:med},{label:"Low",color:"var(--jade)",bg:"var(--jade2)",data:low}].map(({label,color,bg,data})=>{
          const p2 = data.total ? Math.round(data.done/data.total*100) : 0;
          return (
            <div key={label} className="rounded-xl p-3" style={{background:"white",border:"1px solid var(--cream3)"}}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{color,fontSize:10}}>{label}</span>
                <span className="font-mono text-xs" style={{color:"var(--muted)"}}>{data.done}/{data.total}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{background:bg}}>
                <div className="h-full rounded-full" style={{width:`${p2}%`,background:color}} />
              </div>
              <span className="font-mono text-xs" style={{color:"var(--muted)",fontSize:10}}>{p2}% done</span>
            </div>
          );
        })}
      </div>

      {recent.length > 0 && (
        <div className="mb-4">
          <SL label="Recently Completed" />
          <div className="flex flex-col gap-1.5">
            {recent.map(t=>(
              <div key={t.id} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5" style={{background:"white",border:"1px solid var(--cream3)"}}>
                <div className="w-4 h-4 rounded-md flex items-center justify-center text-xs flex-shrink-0" style={{background:"var(--jade)",color:"white"}}>✓</div>
                <span className="text-sm flex-1 line-through truncate" style={{color:"var(--muted)"}}>{t.title}</span>
                <span className="font-mono text-xs flex-shrink-0" style={{color:"var(--ghost)",fontSize:10}}>
                  {t.completedAt ? new Date(t.completedAt).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : ""}
                </span>
                <span className="font-mono text-xs px-1.5 py-0.5 rounded-full flex-shrink-0" style={{fontSize:9,background:t.priority==="high"?"var(--ruby2)":t.priority==="medium"?"var(--amber2)":"var(--jade2)",color:t.priority==="high"?"var(--ruby)":t.priority==="medium"?"var(--amber)":"var(--jade)"}}>
                  {t.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <SL label="Achievements" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-8">
        {ACHIEVEMENTS.map(a=>{
          const unlocked = a.req(userT);
          return (
            <div key={a.id} className="flex items-center gap-3 rounded-xl p-3.5 transition-all" style={{background:unlocked?"var(--gold4)":"white",border:`1px solid ${unlocked?"rgba(196,154,42,0.3)":"var(--cream3)"}`,opacity:unlocked?1:0.38,filter:unlocked?"none":"grayscale(1)"}}>
              <span className="text-2xl flex-shrink-0">{a.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate" style={{color:"var(--ink)"}}>{a.name}</div>
                <div className="text-xs" style={{color:"var(--muted)"}}>{a.desc}</div>
              </div>
              {unlocked && <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{background:"var(--gold2)",color:"white",fontSize:8}}>DONE</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
function SL({label}:{label:string}){return(<div className="flex items-center gap-2 mb-2.5"><span className="text-xs font-semibold uppercase tracking-widest" style={{color:"var(--ghost)",fontSize:10}}>{label}</span><span className="flex-1 h-px" style={{background:"var(--cream3)"}} /></div>);}
