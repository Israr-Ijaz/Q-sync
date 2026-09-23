"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, ArrowRight, Lock, Mail, Loader2, Eye, EyeOff, Clock } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
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
  const router = useRouter();
  const supabase = useRef(createClient()).current;
  const passwordRef = useRef<HTMLInputElement>(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const [form, setForm] = useState<LoginFormState>({
    email: "",
    password: "",
    loading: false,
    error: null,
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field: keyof Pick<LoginFormState, "email" | "password">) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value, error: null }));
    };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      setForm((prev) => ({ ...prev, error: "Please fill in all fields." }));
      return;
    }
    setForm((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });

      if (authError || !authData.user) {
        setForm((prev) => ({
          ...prev,
          loading: false,
          error: authError?.message ?? "Authentication failed. Please try again.",
        }));
        return;
      }

      // Fetch role to route doctor vs receptionist
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle();

      const role = (profile?.role as string | undefined) ?? "receptionist";
      if (role === "admin") {
        // Admins land directly on Staff Roster — the most actionable page.
        router.push("/dashboard/admin/staff");
      } else if (role === "doctor") {
        router.push("/dashboard/doctor");
      } else {
        router.push("/dashboard/receptionist");
      }
    } catch (err) {
      console.error("[Login] Unexpected error:", err);
      setForm((prev) => ({
        ...prev,
        loading: false,
        error: "An unexpected error occurred. Please try again.",
      }));
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-slate-950 text-white animate-in fade-in duration-700">
      
      {/* ── Left Column (The Form) ── */}
      <div className="flex flex-col p-8 md:p-16 justify-center relative">
        {/* Logo at top left */}
        <div className="absolute top-8 left-8 md:top-12 md:left-12">
          <a href="/" className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-white hover:opacity-80 transition-opacity">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Stethoscope size={17} strokeWidth={2.2} />
            </span>
            <span className="text-[17px]">opedox</span>
          </a>
        </div>

        {/* Content wrapper */}
        <div className="w-full max-w-md mx-auto mt-16 md:mt-0">
          <header className="mb-8 space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Welcome back, Doc.
            </h1>
            <p className="text-slate-400 text-sm">
              Let's get that waiting room cleared out.
            </p>
          </header>

          <form
            id="opedox-login-form"
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
                  placeholder="clinic@opedox.med"
                  value={form.email}
                  onChange={handleChange("email")}
                  disabled={form.loading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      passwordRef.current?.focus();
                    }
                  }}
                  className={cn(
                    "h-11 pl-10 pr-4",
                    "border-slate-800 bg-slate-900 text-slate-100",
                    "placeholder:text-slate-600",
                    "focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20",
                    "transition-all duration-200"
                  )}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-medium text-slate-400"
                >
                  Password
                </label>
                <a
                  href="/forgot-password"
                  className="text-xs font-medium text-emerald-500 transition-colors hover:text-emerald-400"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <Input
                  id="login-password"
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  value={form.password}
                  onChange={handleChange("password")}
                  disabled={form.loading}
                  className={cn(
                    "h-11 pl-10 pr-10",
                    "border-slate-800 bg-slate-900 text-slate-100",
                    "placeholder:text-slate-600",
                    "focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20",
                    "transition-all duration-200"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-500 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
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
                "group relative mt-4 flex h-11 w-full items-center justify-center gap-2 overflow-hidden",
                "rounded-xl px-6 text-sm font-semibold text-white",
                "bg-emerald-600 hover:bg-emerald-500",
                "transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                "disabled:cursor-not-allowed disabled:opacity-60"
              )}
            >
              {form.loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Authenticating…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </>
              )}
            </button>
          </form>

          {/* ── Sign Up prompt ── */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Don't have an account?{" "}
              <a
                href="/signup"
                className="font-medium text-emerald-500 transition-colors hover:text-emerald-400"
              >
                Sign Up
              </a>
            </p>
          </div>

          {/* ── Staff notice ── */}
          <div
            id="staff-password-notice"
            className="mt-8 flex items-start gap-2.5 rounded-xl border border-amber-500/15 bg-amber-500/[0.06] px-4 py-3"
          >
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-2.5 w-2.5" aria-hidden="true">
                <path d="M8 1a1 1 0 0 1 .894.553l5.5 11A1 1 0 0 1 13.5 14h-11a1 1 0 0 1-.894-1.447l5.5-11A1 1 0 0 1 8 1Zm0 4a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 8 5Zm0 7a.875.875 0 1 0 0-1.75A.875.875 0 0 0 8 12Z" />
              </svg>
            </span>
            <p className="text-[11px] leading-relaxed text-amber-500/80">
              <span className="font-semibold text-amber-400">Staff members:</span> If you forgot your password, please contact your{" "}
              <span className="font-medium text-amber-400">Clinic Admin</span> to reset it.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Column (The Opedox Showcase) ── */}
      <div className="hidden md:flex flex-col items-center justify-center relative overflow-hidden bg-slate-900 border-l border-white/5">
        {/* Deep emerald radial gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15),transparent_60%)]" />
        
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center px-8">
          {/* Icon */}
          <div className="relative mb-8">
            <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-emerald-500/20 blur-[60px]" />
            <div className="flex size-24 items-center justify-center rounded-3xl border border-emerald-500/20 bg-slate-950/40 backdrop-blur-xl shadow-[0_0_50px_rgba(16,185,129,0.2)]">
              <Clock size={48} className="text-emerald-500 animate-pulse" strokeWidth={1.5} />
            </div>
          </div>
          
          <h2 className="text-4xl font-bold tracking-tight text-white mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            {greeting}, team.
          </h2>
          <p className="text-slate-400 mb-8 max-w-sm">
            Let's clear out the waiting room.
          </p>
        </div>
      </div>

    </div>
  );
}