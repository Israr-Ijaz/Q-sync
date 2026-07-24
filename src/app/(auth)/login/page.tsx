"use client";

import { useState } from "react";
import { Stethoscope, ShieldCheck, ArrowRight, Lock, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface LoginFormState {
  email: string;
  password: string;
  loading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function LoginPage() {
  const [form, setForm] = useState<LoginFormState>({
    email: "",
    password: "",
    loading: false,
    error: null,
  });

  const handleChange = (field: keyof Pick<LoginFormState, "email" | "password">) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value, error: null }));
    };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setForm((prev) => ({ ...prev, error: "Please fill in all fields." }));
      return;
    }
    setForm((prev) => ({ ...prev, loading: true, error: null }));
    // TODO: replace with real auth call (e.g. Supabase signInWithPassword)
    await new Promise((r) => setTimeout(r, 1500));
    setForm((prev) => ({ ...prev, loading: false }));
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950">

      {/* ── Ambient background radial glows ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
      >
        {/* Top-left emerald orb */}
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-[120px]" />
        {/* Bottom-right cyan orb */}
        <div className="absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-[120px]" />
        {/* Center subtle glow */}
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/5 blur-[100px]" />
      </div>

      {/* ── Architectural dot-grid overlay ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(148,163,184,0.07) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ── Main glassmorphic card ── */}
      <main className="relative z-10 w-full max-w-md px-4">
        <div
          className={cn(
            "rounded-2xl border border-white/[0.08]",
            "bg-white/[0.04] backdrop-blur-xl",
            "shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_32px_64px_rgba(0,0,0,0.5)]",
            "p-8 sm:p-10"
          )}
        >
          {/* ── Brand identity badge ── */}
          <header className="mb-8 flex flex-col items-center gap-4 text-center">
            {/* Icon mark */}
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

            {/* Wordmark */}
            <div className="space-y-1">
              <h1 className="bg-gradient-to-r from-slate-100 via-white to-slate-300 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
                QSync Medical
              </h1>
              <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
                OPD Terminal Access
              </p>
            </div>

            {/* Thin rule */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </header>

          {/* ── Login form ── */}
          <form
            id="qsync-login-form"
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5"
          >
            {/* Clinic Email / ID */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
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
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="clinic@qsync.med"
                  value={form.email}
                  onChange={handleChange("email")}
                  disabled={form.loading}
                  className={cn(
                    "h-11 pl-10 pr-4",
                    "border-white/[0.08] bg-white/[0.04] text-slate-100",
                    "placeholder:text-slate-600",
                    "focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20",
                    "transition-all duration-200",
                    "dark:bg-white/[0.04] dark:border-white/[0.08]"
                  )}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-slate-400"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  value={form.password}
                  onChange={handleChange("password")}
                  disabled={form.loading}
                  className={cn(
                    "h-11 pl-10 pr-4",
                    "border-white/[0.08] bg-white/[0.04] text-slate-100",
                    "placeholder:text-slate-600",
                    "focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20",
                    "transition-all duration-200",
                    "dark:bg-white/[0.04] dark:border-white/[0.08]"
                  )}
                />
              </div>
            </div>

            {/* Inline error */}
            {form.error && (
              <p
                role="alert"
                className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400"
              >
                {form.error}
              </p>
            )}

            {/* Submit CTA */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={form.loading}
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
              {/* Shine sweep on hover */}
              <span
                aria-hidden="true"
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-500 group-hover:translate-x-full"
              />

              {form.loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Authenticating…</span>
                </>
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </>
              )}
            </button>
          </form>

          {/* ── Security footer badge ── */}
          <footer className="mt-8">
            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <ShieldCheck
                className="h-4 w-4 shrink-0 text-emerald-500"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <p className="text-xs text-slate-500">
                End-to-End Encrypted OPD Node &mdash;{" "}
                <span className="text-emerald-600">TLS 1.3</span>
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