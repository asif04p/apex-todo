"use client";
interface Props { icon: string; title: string; body: string; }
export default function ToastNotification({ icon, title, body }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-2xl px-4 py-3 animate-toast-in"
      style={{background:"var(--ink)",color:"rgba(255,255,255,0.9)",maxWidth:300,boxShadow:"0 12px 40px rgba(15,14,12,0.2)",minWidth:220}}>
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <div className="text-sm font-semibold mb-0.5">{title}</div>
        <div className="text-xs leading-snug" style={{color:"rgba(255,255,255,0.45)"}}>{body}</div>
      </div>
    </div>
  );
}
