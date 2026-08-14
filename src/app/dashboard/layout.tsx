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
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

// ---------------------------------------------------------------------------
// Navigation config
// ---------------------------------------------------------------------------
const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard }, // <--- New!
  { label: "Queue", href: "/dashboard/queue", icon: Users },
  { label: "Prescriptions", href: "/dashboard/prescriptions", icon: FileText },
  { label: "Patients", href: "/dashboard/patients", icon: FolderHeart },
  { label: "QR Standee", href: "/dashboard/admin/qr-builder", icon: QrCode }, // <--- New!
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
          QSync
        </span>
        <span className="text-[10px] font-medium uppercase tracking-widest text-slate-600">
          Medical
        </span>
      </div>
    </Link>
  );
}

/** Single sidebar nav link */
function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
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
          <p className="truncate text-[10px] text-slate-600">admin@qsync.med</p>
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
  onCloseMobile,
}: {
  pathname: string;
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
export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">

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
        <SidebarContent pathname={pathname} onCloseMobile={() => setMobileOpen(false)} />
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
        <SidebarContent pathname={pathname} />
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
    </div>
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
