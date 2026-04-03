"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");

  useEffect(() => {
    const msg = searchParams.get("message");
    if (msg === "verified") setSuccess("Email verified! You can now log in.");
    if (msg === "registered") setSuccess("Account created! Check your email to verify your account.");
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setNeedsVerification(false);
    if (!form.email.trim() || !form.password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Login failed.");
        if (data.needsVerification) setNeedsVerification(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!form.email) { setError("Enter your email first."); return; }
    setResendLoading(true); setResendSuccess(""); setError("");
    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (data.success) {
        setResendSuccess(data.devToken
          ? `DEV MODE — Token: ${data.devToken.slice(0, 16)}... (check server console for full link)`
          : "Verification email sent! Check your inbox.");
      } else {
        setError(data.error || "Failed to resend.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "var(--cream)" }}>
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute" style={{ top: "-10%", right: "-5%", width: 480, height: 480, borderRadius: "50%", border: "1px solid rgba(196,154,42,0.1)" }} />
        <div className="absolute" style={{ bottom: "-15%", left: "-8%", width: 560, height: 560, borderRadius: "50%", border: "1px solid rgba(196,154,42,0.07)" }} />
        <div className="absolute" style={{ top: "20%", left: "10%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(196,154,42,0.06), transparent 70%)" }} />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-serif italic text-xl"
              style={{ background: "var(--ink)", color: "var(--gold2)", fontFamily: "'Fraunces', serif" }}>A</div>
            <span className="text-3xl font-light tracking-tight" style={{ fontFamily: "'Fraunces', serif", color: "var(--ink)" }}>Apex</span>
          </div>
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--muted)" }}>Task Mastery · Premium</p>
        </div>

        <div className="rounded-3xl p-9 shadow-2xl" style={{ background: "white", border: "1px solid var(--cream3)" }}>
          <h1 className="text-2xl font-light mb-1" style={{ fontFamily: "'Fraunces', serif", color: "var(--ink)" }}>Welcome back</h1>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: "var(--muted)" }}>Sign in to your workspace and continue where you left off.</p>

          {success && (
            <div className="flex items-center gap-2 rounded-xl p-3 mb-5 text-sm" style={{ background: "var(--jade2)", color: "var(--jade)" }}>
              <CheckCircle2 size={16} className="flex-shrink-0" />{success}
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 rounded-xl p-3 mb-5 text-sm" style={{ background: "var(--ruby2)", color: "var(--ruby)" }}>
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                {error}
                {needsVerification && (
                  <button onClick={handleResend} disabled={resendLoading}
                    className="block mt-1.5 font-semibold underline underline-offset-2 cursor-pointer" style={{ color: "var(--ruby)" }}>
                    {resendLoading ? "Sending..." : "Resend verification email"}
                  </button>
                )}
              </div>
            </div>
          )}
          {resendSuccess && (
            <div className="flex items-start gap-2 rounded-xl p-3 mb-5 text-sm" style={{ background: "var(--jade2)", color: "var(--jade)" }}>
              <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />{resendSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--muted)" }}>Email Address</label>
              <input className="input-base" type="email" placeholder="you@example.com" autoComplete="email"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--muted)" }}>Password</label>
              <div className="relative">
                <input className="input-base pr-12" type={showPass ? "text" : "password"}
                  placeholder="••••••••" autoComplete="current-password"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors"
                  style={{ color: "var(--muted)" }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary mt-2" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin-slow" /> : null}
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: "var(--cream3)" }} />
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--ghost)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "var(--cream3)" }} />
          </div>

          <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold border-b border-transparent hover:border-current transition-colors"
              style={{ color: "var(--gold)" }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
