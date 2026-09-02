"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  FileText,
  FolderHeart,
  Settings,
  Bell,
  Stethoscope,
  ChevronDown,
  Menu,
  X,
  LogOut,
  User,
  QrCode,
  LayoutDashboard,
  AlertTriangle,
  Lock as LockIcon,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { SubscriptionProvider, useSubscription } from "@/lib/subscription-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** If true, this item requires an active Pro subscription to navigate to */
  pro?: boolean;
}

// ---------------------------------------------------------------------------
// Navigation config
// ---------------------------------------------------------------------------
const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Queue", href: "/dashboard/queue", icon: Users },
  { label: "Prescriptions", href: "/dashboard/prescriptions", icon: FileText, pro: true },
  { label: "Patients", href: "/dashboard/patients", icon: FolderHeart },
  { label: "QR Standee", href: "/dashboard/admin/qr-builder", icon: QrCode },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Sidebar brand lockup */
function SidebarBrand() {
  return (
    <Link
      href="/dashboard"
      className="group flex h-16 shrink-0 items-center gap-3 px-5 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
    >
      {/* Icon mark */}
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/10 blur-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <Stethoscope className="relative h-4 w-4 text-emerald-400" strokeWidth={1.75} />
      </div>
      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-[0.9rem] font-semibold tracking-tight text-transparent">
          Opedox
        </span>
        <span className="text-[10px] font-medium uppercase tracking-widest text-slate-600">
          Medical
        </span>
      </div>
    </Link>
  );
}

/** Single sidebar nav link */
function NavLink({
  item,
  active,
  isProActive,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  isProActive: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  // Locked state — Pro item, subscription inactive
  if (item.pro && !isProActive) {
    return (
      <span
        title="Requires Pro subscription"
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
          "border border-transparent",
          "cursor-not-allowed opacity-50 select-none",
          "text-slate-500"
        )}
        aria-disabled="true"
      >
        {/* Icon */}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-600">
          <LockIcon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        {item.label}
        {/* Pro badge */}
        <span className="ml-auto shrink-0 rounded-full border border-rose-500/25 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-rose-500">
          Pro
        </span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
        "transition-all duration-200 outline-none",
        "focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900",
        active
          ? [
            "bg-gradient-to-r from-emerald-500/15 to-teal-500/10",
            "border border-emerald-500/20",
            "text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_12px_rgba(16,185,129,0.08)]",
          ]
          : [
            "text-slate-400 border border-transparent",
            "hover:bg-slate-800/60 hover:text-slate-200 hover:border-slate-700/50",
          ]
      )}
    >
      {/* Icon glow container */}
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
          active
            ? "bg-emerald-500/15 text-emerald-400"
            : "text-slate-500 group-hover:text-slate-300"
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      {item.label}

      {/* Active indicator pip */}
      {active && (
        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
      )}
    </Link>
  );
}

/** Sidebar footer with user info */
function SidebarFooter({ onCloseMobile }: { onCloseMobile?: () => void }) {
  return (
    <div className="mt-auto border-t border-slate-800/60 px-4 py-4">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/20 text-emerald-400 ring-1 ring-emerald-500/20">
          <User className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-xs font-medium text-slate-200">Dr. Clinic Admin</p>
          <p className="truncate text-[10px] text-slate-600">admin@opedox.med</p>
        </div>
        {/* Sign out */}
        <button
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-800/60 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/** Shared sidebar content — used in both desktop and mobile drawer */
function SidebarContent({
  pathname,
  isProActive,
  onCloseMobile,
}: {
  pathname: string;
  isProActive: boolean;
  onCloseMobile?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <SidebarBrand />

      {/* Section label */}
      <div className="px-5 pb-1 pt-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-700">
          Navigation
        </p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname.startsWith(item.href)}
            isProActive={isProActive}
            onClick={onCloseMobile}
          />
        ))}
      </nav>

      <SidebarFooter onCloseMobile={onCloseMobile} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Inner layout — reads subscription state from context
// ---------------------------------------------------------------------------
function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { isProActive, isLoading: subLoading, broadcastMessage, broadcastActive } = useSubscription();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [broadcastDismissed, setBroadcastDismissed] = useState(false);

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
      <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100">

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
        <div className="relative flex min-h-0 flex-1 overflow-hidden">

          {/* ── Mobile drawer backdrop ── */}
          {mobileOpen && (
            <div
              className="fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* ── Mobile sidebar drawer ── */}
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-40 w-64 lg:hidden",
              "border-r border-slate-800/80",
              "bg-slate-900/95 backdrop-blur-xl",
              "transition-transform duration-300 ease-in-out",
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}
            aria-label="Mobile navigation"
          >
            {/* Close button */}
            <button
              className="absolute right-3 top-[1.1rem] flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800/60 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent pathname={pathname} isProActive={isProActive} onCloseMobile={() => setMobileOpen(false)} />
          </aside>

          {/* ── Desktop sidebar (fixed) ── */}
          <aside
            className={cn(
              "hidden lg:flex lg:w-64 lg:flex-col",
              "fixed inset-y-0 left-0 z-20",
              "border-r border-slate-800/80",
              "bg-slate-900/40 backdrop-blur-xl"
            )}
            aria-label="Desktop navigation"
          >
            <SidebarContent pathname={pathname} isProActive={isProActive} />
          </aside>

          {/* ── Right panel (header + main) ── */}
          <div className="flex flex-1 flex-col lg:pl-64">

            {/* ── Sticky top header ── */}
            <header
              className={cn(
                "sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between",
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
                  <span className="hidden sm:block">Dr. Admin</span>
                  <ChevronDown className="h-3 w-3 text-slate-600" strokeWidth={2} />
                </button>
              </div>
            </header>

            {/* ── Main content area ── */}
            <main
              className="flex-1 overflow-y-auto"
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
              <div className="relative z-10 min-h-full p-5 sm:p-7">
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
