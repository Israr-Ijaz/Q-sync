"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Menu,
  X,
  User,
  AlertTriangle,
  Megaphone,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { SubscriptionProvider, useSubscription } from "@/lib/subscription-context";

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Inner layout — reads subscription state from context
// ---------------------------------------------------------------------------
function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { isProActive, isLoading: subLoading, broadcastMessage, broadcastActive } = useSubscription();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [broadcastDismissed, setBroadcastDismissed] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // ── Dynamic user / clinic data ──────────────────────────────────────────
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState<string | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const supabase = useRef(createClient()).current;

  useEffect(() => {
    let cancelled = false;

    async function fetchUserData() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (cancelled) return;
        if (authError || !user) {
          setIsUserLoading(false);
          return;
        }

        setUserEmail(user.email ?? null);

        // Fetch profile with joined clinic name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role, clinics(name)")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (profile) {
          setUserName(profile.full_name ?? null);
          setUserRole(profile.role ?? null);

          // Resolve joined clinic name (could be object or array)
          const rawClinic = (profile as { clinics?: { name?: string } | { name?: string }[] }).clinics;
          const resolved = Array.isArray(rawClinic)
            ? rawClinic[0]?.name ?? null
            : (rawClinic as { name?: string } | undefined)?.name ?? null;
          setClinicName(resolved);
        }
      } catch (err) {
        console.error("[DashboardLayout] Error fetching user data:", err);
      } finally {
        if (!cancelled) setIsUserLoading(false);
      }
    }

    fetchUserData();
    return () => { cancelled = true; };
  }, [supabase]);

  // ── Sign-out handler ────────────────────────────────────────────────────
  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }, [supabase, router]);

  const showBroadcast = broadcastActive && !!broadcastMessage && !broadcastDismissed;

  // ── Mobile drawer helpers ────────────────────────────────────────────────
  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100 print:overflow-visible print:h-auto print:block">

      {/* ── Global Broadcast Banner ── */}
      {showBroadcast && (
        <div
          id="global-broadcast-banner"
          role="alert"
          aria-live="polite"
          className={cn(
            "relative z-50 flex w-full shrink-0 items-center justify-between gap-3",
            "bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600",
            "px-4 py-2.5 sm:px-6",
            "shadow-[0_2px_16px_rgba(245,158,11,0.4)]",
            "border-b border-amber-400/30",
          )}
        >
          <div className="flex items-center gap-2.5">
            <Megaphone className="h-4 w-4 shrink-0 text-white/90" strokeWidth={2} aria-hidden="true" />
            <p className="text-sm font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.2)] leading-snug">
              {broadcastMessage}
            </p>
          </div>
          <button
            id="broadcast-dismiss-btn"
            onClick={() => setBroadcastDismissed(true)}
            aria-label="Dismiss announcement"
            className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-white/70 hover:text-white hover:bg-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Subscription Paywall Banner ── */}
      {!subLoading && !isProActive && (
        <div
          id="paywall-banner"
          role="alert"
          aria-live="polite"
          className={cn(
            "relative z-50 flex w-full shrink-0 items-center justify-between gap-4",
            "bg-gradient-to-r from-rose-700 via-red-600 to-rose-700",
            "px-4 py-3 sm:px-6",
            "shadow-[0_4px_24px_rgba(225,29,72,0.45)]",
            "border-b border-red-500/40",
          )}
        >
          {/* Animated pulse ring behind icon */}
          <div className="flex items-start gap-3 sm:items-center">
            <span className="relative flex shrink-0 items-center justify-center">
              <span className="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-white/20 opacity-60" />
              <AlertTriangle
                className="relative h-5 w-5 text-white drop-shadow"
                strokeWidth={2.2}
                aria-hidden="true"
              />
            </span>
            <p className="text-sm font-medium leading-snug text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.25)]">
              <span className="font-bold">⚠️ Your Pro Plan has expired.</span>{" "}
              You are missing automated patient re-bookings and your advanced
              features are locked.{" "}
              <span className="font-semibold">Upgrade now to restore full access.</span>
            </p>
          </div>

          {/* CTA */}
          <a
            id="paywall-cta-btn"
            href="https://wa.me/923000000000?text=I%20need%20to%20renew%20my%20Opedox%20Pro%20subscription"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "shrink-0 whitespace-nowrap rounded-xl px-4 py-2",
              "bg-white text-red-700 text-sm font-bold",
              "shadow-md hover:shadow-lg",
              "transition-all duration-150 hover:bg-red-50 hover:scale-[1.03] active:scale-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-red-600",
            )}
          >
            Contact Sales to Upgrade
          </a>
        </div>
      )}

      {/* ── Main flex row (sidebar + content) ── */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden print:overflow-visible print:block">

        <Sidebar 
          pathname={pathname}
          isProActive={isProActive}
          userName={userName}
          userEmail={userEmail}
          isUserLoading={isUserLoading}
          userRole={userRole}
          onSignOut={handleSignOut}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          onCollapseChange={setIsSidebarCollapsed}
        />

        {/* ── Right panel (header + main) ── */}
        <div className={cn("flex flex-1 flex-col print:block print:pl-0 transition-all duration-300 ease-in-out", isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64")}>

          {/* ── Sticky top header ── */}
          <header
            className={cn(
              "sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between print:hidden",
              "border-b border-slate-800/60",
              "bg-slate-950/80 backdrop-blur-xl",
              "px-4 sm:px-6"
            )}
          >
            {/* Left: mobile hamburger + page breadcrumb */}
            <div className="flex items-center gap-3">
              {/* Mobile menu trigger */}
              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800/60 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
                aria-expanded={mobileOpen}
              >
                <Menu className="h-4.5 w-4.5" />
              </button>

              {/* Page title derived from pathname */}
              <PageBreadcrumb pathname={pathname} />
            </div>

            {/* Right: notification + profile */}
            <div className="flex items-center gap-2">
              {/* Notification bell */}
              <button
                id="header-notifications-btn"
                className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-800/60 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" strokeWidth={1.75} />
                {/* Unread pip */}
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
              </button>

              {/* Divider */}
              <div className="mx-1 h-5 w-px bg-slate-800" />

              {/* Clinic profile chip */}
              <button
                id="header-profile-btn"
                className={cn(
                  "flex items-center gap-2.5 rounded-xl",
                  "border border-slate-800/60 bg-slate-900/60 px-3 py-1.5",
                  "text-xs font-medium text-slate-300",
                  "transition-all duration-200 hover:border-slate-700/80 hover:bg-slate-800/60",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600"
                )}
                aria-label="Clinic profile menu"
                aria-haspopup="true"
              >
                {/* Avatar */}
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/20 text-emerald-400 ring-1 ring-emerald-500/20">
                  <User className="h-3 w-3" strokeWidth={2} />
                </span>
                <span className="hidden sm:block">
                  {isUserLoading ? (
                    <span className="inline-block h-3 w-16 animate-pulse rounded bg-slate-700/60" />
                  ) : (
                    <>
                      {clinicName ?? userName ?? "Dashboard"}
                      {userRole && (
                        <span className="ml-1.5 rounded-md border border-slate-700/50 bg-slate-800/60 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-slate-500">
                          {userRole}
                        </span>
                      )}
                    </>
                  )}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-600" strokeWidth={2} />
              </button>
            </div>
          </header>

          {/* ── Main content area ── */}
          <main
            className="flex-1 overflow-y-auto print:overflow-visible print:block"
            id="dashboard-main-content"
          >
            {/* Subtle ambient top glow inherited from login aesthetic */}
            <div
              aria-hidden="true"
              className="pointer-events-none fixed right-0 top-16 h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[100px]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none fixed bottom-0 left-64 h-[300px] w-[500px] rounded-full bg-cyan-500/5 blur-[100px]"
            />

            {/* Content wrapper */}
            <div className="relative z-10 min-h-full p-5 sm:p-7 print:p-0 print:block">
              {children}
            </div>
          </main>
        </div>

      </div>{/* end main flex row */}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Outer layout — wraps everything in the SubscriptionProvider
// ---------------------------------------------------------------------------
export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SubscriptionProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </SubscriptionProvider>
  );
}

// ---------------------------------------------------------------------------
// Page breadcrumb — derives label from current pathname
// ---------------------------------------------------------------------------
const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/queue": "OPD Queue",
  "/dashboard/prescriptions": "Prescriptions",
  "/dashboard/patients": "Patients",
  "/dashboard/settings": "Settings",
  "/dashboard/admin": "Overview",
  "/dashboard/admin/clinic": "Clinic Settings",
  "/dashboard/admin/staff": "Staff Roster",
  "/dashboard/admin/qr-builder": "QR Standee",
  "/dashboard/doctor": "Prescription Pad",
};

function PageBreadcrumb({ pathname }: { pathname: string }) {
  // Match the most specific route first
  const label =
    Object.entries(ROUTE_LABELS)
      .sort(([a], [b]) => b.length - a.length)
      .find(([route]) => pathname.startsWith(route))?.[1] ?? "Dashboard";

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <span className="hidden rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-500 sm:block">
        Live
      </span>
    </div>
  );
}
