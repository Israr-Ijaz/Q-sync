"use client";

import { useState, useTransition } from "react";
import {
  Stethoscope,
  ShieldCheck,
  ArrowRight,
  Lock,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { updatePasswordAction } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const result = await updatePasswordAction(password);
      // If result returns (i.e. no redirect), it must be an error.
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  // Password strength indicator
  const strength = (() => {
    if (password.length === 0) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = [
    "",
    "bg-red-500",
    "bg-amber-500",
    "bg-yellow-400",
    "bg-emerald-500",
  ][strength];

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950">

      {/* ── Ambient glows ── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/5 blur-[100px]" />
      </div>

      {/* ── Dot-grid ── */}
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
                Set New Password
              </h1>
              <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
                Opedox Medical
              </p>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </header>

          <p className="mb-6 text-center text-xs text-slate-400">
            Choose a strong password for your Opedox account.
          </p>

          {/* ── Form ── */}
          <form
            id="update-password-form"
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5"
          >
            {/* New Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="up-password"
                className="block text-xs font-medium text-slate-400"
              >
                New Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <Input
                  id="up-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  disabled={isPending}
                  className={cn(
                    "h-11 pl-10 pr-10",
                    "border-white/[0.08] bg-white/[0.04] text-slate-100",
                    "placeholder:text-slate-600",
                    "focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20",
                    "transition-all duration-200"
                  )}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300 focus-visible:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Strength meter */}
              {password.length > 0 && (
                <div className="space-y-1 pt-0.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-all duration-300",
                          i <= strength ? strengthColor : "bg-white/10"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-right text-[10px] text-slate-500">
                    {strengthLabel}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="up-confirm"
                className="block text-xs font-medium text-slate-400"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <Input
                  id="up-confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••••"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setError(null);
                  }}
                  disabled={isPending}
                  className={cn(
                    "h-11 pl-10 pr-10",
                    "border-white/[0.08] bg-white/[0.04] text-slate-100",
                    "placeholder:text-slate-600",
                    "focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20",
                    "transition-all duration-200",
                    confirm.length > 0 &&
                      (confirm === password
                        ? "border-emerald-500/40"
                        : "border-red-500/40")
                  )}
                />
                <button
                  type="button"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300 focus-visible:outline-none"
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {confirm.length > 0 && confirm !== password && (
                <p className="text-[10px] text-red-400">
                  Passwords do not match
                </p>
              )}
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
              id="up-submit-btn"
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
                  <span>Updating password…</span>
                </>
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </>
              )}
            </button>
          </form>

          {/* ── Security footer ── */}
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
