"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("No verification token found."); return; }
    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(r => r.json()).then(data => {
      if (data.success) {
        setStatus("success");
        setMessage(data.message || "Email verified!");
        setTimeout(() => router.push("/dashboard"), 2500);
      } else if (data.expired) {
        setStatus("expired"); setMessage(data.error); setEmail(data.email || "");
      } else {
        setStatus("error"); setMessage(data.error || "Verification failed.");
      }
    }).catch(() => { setStatus("error"); setMessage("Network error. Please try again."); });
  }, [token, router]);

  const handleResend = async () => {
    if (!email) return;
    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) setResendDone(true);
    } finally { setResendLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--cream)" }}>
      <div className="w-full max-w-md animate-pop-in">
        <div className="rounded-3xl p-10 text-center shadow-2xl" style={{ background: "white", border: "1px solid var(--cream3)" }}>
          {status === "loading" && (
            <>
              <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: "var(--cream2)" }}>
                <Loader2 size={36} className="animate-spin-slow" style={{ color: "var(--gold2)" }} />
              </div>
              <h2 className="text-2xl font-light mb-2" style={{ fontFamily: "'Fraunces', serif" }}>Verifying your email…</h2>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Please wait a moment.</p>
            </>
          )}
          {status === "success" && (
            <>
              <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center animate-bounce-in" style={{ background: "var(--jade2)" }}>
                <CheckCircle2 size={40} style={{ color: "var(--jade)" }} />
              </div>
              <h2 className="text-2xl font-light mb-2" style={{ fontFamily: "'Fraunces', serif", color: "var(--ink)" }}>Email verified!</h2>
              <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>{message}<br/>Redirecting you to your dashboard…</p>
              <Link href="/dashboard" className="btn-primary inline-flex">Go to Dashboard →</Link>
            </>
          )}
          {(status === "error" || status === "expired") && (
            <>
              <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: "var(--ruby2)" }}>
                {status === "expired" ? <Mail size={38} style={{ color: "var(--ruby)" }} /> : <XCircle size={38} style={{ color: "var(--ruby)" }} />}
              </div>
              <h2 className="text-2xl font-light mb-2" style={{ fontFamily: "'Fraunces', serif", color: "var(--ink)" }}>
                {status === "expired" ? "Link expired" : "Verification failed"}
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>{message}</p>
              {status === "expired" && !resendDone && (
                <button onClick={handleResend} disabled={resendLoading} className="btn-primary mb-4" style={{ maxWidth: 280, margin: "0 auto 16px" }}>
                  {resendLoading ? <Loader2 size={16} className="animate-spin-slow" /> : null}
                  {resendLoading ? "Sending…" : "Resend verification email"}
                </button>
              )}
              {resendDone && (
                <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: "var(--jade2)", color: "var(--jade)" }}>
                  ✓ New verification email sent! Check your inbox.
                </div>
              )}
              <Link href="/login" className="text-sm font-semibold" style={{ color: "var(--gold)" }}>← Back to Login</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
