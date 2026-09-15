"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Stethoscope,
  ShieldCheck,
  ArrowRight,
  Mail,
  Loader2,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { forgotPasswordAction } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await forgotPasswordAction(email);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950">

      {/* ── Ambient radial glows ── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/5 blur-[100px]" />
      </div>

      {/* ── Dot-grid overlay ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(148,163,184,0.07) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ── Glassmorphic card ── */}
      <main className="relative z-10 w-full max-w-md px-4">
        <div
          className={cn(
            "rounded-2xl border border-white/[0.08]",
            "bg-white/[0.04] backdrop-blur-xl",
            "shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_32px_64px_rgba(0,0,0,0.5)]",
            "p-8 sm:p-10"
          )}
        >
          {/* ── Brand badge ── */}
          <header className="mb-8 flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/30 to-cyan-400/20 blur-xl" />
              <div
                className={cn(
                  "relative flex h-14 w-14 items-center justify-center rounded-2xl",
                  "bg-gradient-to-br from-emerald-500/20 to-cyan-500/10",
                  "border border-emerald-500/20",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                )}
              >
                <Stethoscope
                  className="h-7 w-7 text-emerald-400"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="bg-gradient-to-r from-slate-100 via-white to-slate-300 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
                Reset Password
              </h1>
              <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
                Opedox Medical
              </p>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </header>

          {/* ── Success state ── */}
          {success ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <CheckCircle2
                  className="h-7 w-7 text-emerald-400"
                  strokeWidth={1.5}
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-200">
                  Check your inbox
                </p>
                <p className="text-xs text-slate-500">
                  If an account exists for{" "}
                  <span className="text-emerald-400">{email}</span>, a password
                  reset link has been sent.
                </p>
              </div>
              <Link
                href="/login"
                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-400 transition-colors hover:text-emerald-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-6 text-center text-xs text-slate-400">
                Enter your clinic email and we&apos;ll send a secure reset link.
              </p>

              {/* ── Form ── */}
              <form
                id="forgot-password-form"
                onSubmit={handleSubmit}
                noValidate
                className="space-y-5"
              >
                {/* Email */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="fp-email"
                    className="block text-xs font-medium text-slate-400"
                  >
                    Clinic Email / Terminal ID
                  </label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                      aria-hidden="true"
                    />
                    <Input
                      id="fp-email"
                      type="email"
                      autoComplete="email"
                      placeholder="clinic@opedox.med"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      disabled={isPending}
                      className={cn(
                        "h-11 pl-10 pr-4",
                        "border-white/[0.08] bg-white/[0.04] text-slate-100",
                        "placeholder:text-slate-600",
                        "focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20",
                        "transition-all duration-200"
                      )}
                    />
                  </div>
                </div>

                {/* Inline error */}
                {error && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400"
                  >
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  id="fp-submit-btn"
                  type="submit"
                  disabled={isPending}
                  className={cn(
                    "group relative mt-2 flex h-11 w-full items-center justify-center gap-2 overflow-hidden",
                    "rounded-xl px-6 text-sm font-semibold text-white",
                    "bg-gradient-to-r from-emerald-500 to-teal-500",
                    "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
                    "transition-all duration-300",
                    "hover:shadow-[0_0_32px_rgba(16,185,129,0.45)] hover:brightness-110 hover:-translate-y-px",
                    "active:translate-y-0 active:brightness-95",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                    "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:brightness-100 disabled:hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-500 group-hover:translate-x-full"
                  />
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Sending link…</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </>
                  )}
                </button>
              </form>

              {/* Back to login */}
              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-300"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Back to Login
                </Link>
              </div>
            </>
          )}

          {/* ── Security footer ── */}
          <footer className="mt-8">
            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <ShieldCheck
                className="h-4 w-4 shrink-0 text-emerald-500"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <p className="text-xs text-slate-500">
                Reset links expire after{" "}
                <span className="text-emerald-600">1 hour</span>
              </p>
            </div>

            <p className="mt-5 text-center text-[11px] text-slate-700">
              Authorized clinical personnel only &middot; All sessions are audited
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
