"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Mail } from "lucide-react";

function getStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColors = ["", "var(--ruby)", "var(--amber)", "var(--gold2)", "var(--jade)"];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ message: string; devToken?: string } | null>(null);

  const strength = getStrength(form.password);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Name must be at least 2 characters.";
    if (!form.email.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match.";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setGlobalError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), password: form.password }),
      });
      const data = await res.json();
      if (data.success) {
        setDone({ message: data.message, devToken: data.devToken });
      } else {
        setGlobalError(data.error || "Registration failed.");
      }
    } catch {
      setGlobalError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "var(--cream)" }}>
        <div className="w-full max-w-[420px] animate-pop-in">
          <div className="rounded-3xl p-10 text-center shadow-2xl" style={{ background: "white", border: "1px solid var(--cream3)" }}>
            <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center text-4xl animate-bounce-in"
              style={{ background: "var(--jade2)", color: "var(--jade)" }}>
              <Mail size={36} />
            </div>
            <h2 className="text-2xl font-light mb-3" style={{ fontFamily: "'Fraunces', serif", color: "var(--ink)" }}>Check your inbox</h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--muted)" }}>{done.message}</p>
            {done.devToken && (
              <div className="rounded-xl p-4 mb-6 text-left" style={{ background: "var(--gold4)", border: "1px solid rgba(196,154,42,0.25)" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--gold)" }}>🛠 Dev Mode — No SMTP configured</p>
                <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>Check the server console for the verification URL, or click below:</p>
                <a href={`/verify-email?token=${done.devToken}`}
                  className="text-xs font-semibold underline" style={{ color: "var(--cobalt)" }}>
                  → Click here to verify immediately
                </a>
              </div>
            )}
            <Link href="/login"
              className="inline-block w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "var(--ink)", color: "var(--gold3)" }}>
              Back to Login →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const field = (id: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div>
      <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--muted)" }}>{label}</label>
      <input className={`input-base ${errors[id] ? "error" : ""}`} type={type} placeholder={placeholder}
        value={form[id]} onChange={e => { setForm(f => ({ ...f, [id]: e.target.value })); if (errors[id]) setErrors(v => ({ ...v, [id]: "" })); }} />
      {errors[id] && <p className="text-xs mt-1.5" style={{ color: "var(--ruby)" }}>{errors[id]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "var(--cream)" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute" style={{ top: "-10%", left: "-5%", width: 440, height: 440, borderRadius: "50%", border: "1px solid rgba(196,154,42,0.1)" }} />
        <div className="absolute" style={{ bottom: "-15%", right: "-8%", width: 520, height: 520, borderRadius: "50%", border: "1px solid rgba(196,154,42,0.07)" }} />
      </div>

      <div className="w-full max-w-[440px] relative z-10 animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-serif italic text-xl"
              style={{ background: "var(--ink)", color: "var(--gold2)", fontFamily: "'Fraunces', serif" }}>A</div>
            <span className="text-3xl font-light tracking-tight" style={{ fontFamily: "'Fraunces', serif", color: "var(--ink)" }}>Apex</span>
          </div>
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--muted)" }}>Task Mastery · Premium</p>
        </div>

        <div className="rounded-3xl p-9 shadow-2xl" style={{ background: "white", border: "1px solid var(--cream3)" }}>
          <h1 className="text-2xl font-light mb-1" style={{ fontFamily: "'Fraunces', serif", color: "var(--ink)" }}>Create your account</h1>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: "var(--muted)" }}>Join and start mastering your tasks with XP, streaks, and rewards.</p>

          {globalError && (
            <div className="flex items-center gap-2 rounded-xl p-3 mb-5 text-sm" style={{ background: "var(--ruby2)", color: "var(--ruby)" }}>
              <AlertCircle size={16} className="flex-shrink-0" />{globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {field("name", "Full Name", "text", "Ada Lovelace")}
            {field("email", "Email Address", "email", "you@example.com")}
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--muted)" }}>Password</label>
              <div className="relative">
                <input className={`input-base pr-12 ${errors.password ? "error" : ""}`}
                  type={showPass ? "text" : "password"} placeholder="At least 8 characters" autoComplete="new-password"
                  value={form.password} onChange={e => { setForm(f => ({ ...f, password: e.target.value })); if (errors.password) setErrors(v => ({ ...v, password: "" })); }} />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: "var(--muted)" }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className={`str-bar str-${strength}`}>
                    {[1,2,3,4].map(i => <div key={i} className="str-seg" />)}
                  </div>
                  <p className="text-xs mt-1" style={{ color: strengthColors[strength] }}>{strengthLabels[strength]}</p>
                </div>
              )}
              {errors.password && <p className="text-xs mt-1.5" style={{ color: "var(--ruby)" }}>{errors.password}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--muted)" }}>Confirm Password</label>
              <input className={`input-base ${errors.confirm ? "error" : ""}`} type="password"
                placeholder="Repeat your password" autoComplete="new-password"
                value={form.confirm} onChange={e => { setForm(f => ({ ...f, confirm: e.target.value })); if (errors.confirm) setErrors(v => ({ ...v, confirm: "" })); }} />
              {errors.confirm && <p className="text-xs mt-1.5" style={{ color: "var(--ruby)" }}>{errors.confirm}</p>}
            </div>
            <button type="submit" className="btn-primary mt-2" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin-slow" /> : null}
              {loading ? "Creating account…" : "Create Account →"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: "var(--cream3)" }} />
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--ghost)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "var(--cream3)" }} />
          </div>

          <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold border-b border-transparent hover:border-current transition-colors" style={{ color: "var(--gold)" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
