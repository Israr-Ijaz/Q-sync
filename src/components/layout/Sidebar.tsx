"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  FileText,
  FolderHeart,
  Settings,
  Stethoscope,
  X,
  LogOut,
  User,
  QrCode,
  LayoutDashboard,
  Lock as LockIcon,
  Building2,
  UserCog,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  pro?: boolean;
  roles?: string[];
}

// ---------------------------------------------------------------------------
// Navigation config
// ---------------------------------------------------------------------------
const NAV_ITEMS: NavItem[] = [
  { label: "Prescription Pad", href: "/dashboard/doctor", icon: Stethoscope, roles: ['admin', 'doctor'] },
  { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard, roles: ['admin'] },
  { label: "QR Standee", href: "/dashboard/admin/qr-builder", icon: QrCode, roles: ['admin'] },
  { label: "Clinic Settings", href: "/dashboard/admin/clinic", icon: Building2, roles: ['admin'] },
  { label: "Staff Roster", href: "/dashboard/admin/staff", icon: UserCog, roles: ['admin'] },
  { label: "Queue", href: "/dashboard/queue", icon: Users },
  { label: "Prescriptions", href: "/dashboard/prescriptions", icon: FileText, pro: true },
  { label: "Patients", href: "/dashboard/patients", icon: FolderHeart },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

function SidebarBrand({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        "group flex h-16 shrink-0 items-center gap-3 px-5 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        isCollapsed && "justify-center px-0"
      )}
    >
      <Image src="/icon.png" alt="Opedox Logo" width={32} height={32} className="rounded-xl shadow-sm shrink-0" />
      {!isCollapsed && (
        <div className="flex flex-col leading-none">
          <span className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-[0.9rem] font-semibold tracking-tight text-transparent">
            Opedox
          </span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-slate-600">
            Medical
          </span>
        </div>
      )}
    </Link>
  );
}

function NavLink({
  item,
  active,
  isProActive,
  onClick,
  isCollapsed,
}: {
  item: NavItem;
  active: boolean;
  isProActive: boolean;
  onClick?: () => void;
  isCollapsed: boolean;
}) {
  const Icon = item.icon;

  if (item.pro && !isProActive) {
    return (
      <span
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
          "border border-transparent",
          "cursor-not-allowed opacity-50 select-none",
          "text-slate-500",
          isCollapsed && "justify-center px-0"
        )}
        aria-disabled="true"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-600">
          <LockIcon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        {!isCollapsed && item.label}
        {!isCollapsed && (
          <span className="ml-auto shrink-0 rounded-full border border-rose-500/25 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-rose-500">
            Pro
          </span>
        )}
        {isCollapsed && (
          <div className="absolute left-full ml-4 hidden rounded-md bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100 z-50 whitespace-nowrap border border-slate-700/50">
            {item.label} (Pro)
          </div>
        )}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
        "transition-all duration-200 outline-none",
        "focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900",
        isCollapsed && "justify-center px-0",
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
      {!isCollapsed && item.label}

      {!isCollapsed && active && (
        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
      )}

      {isCollapsed && (
        <div className="absolute left-full ml-4 hidden rounded-md bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100 z-50 whitespace-nowrap border border-slate-700/50">
          {item.label}
        </div>
      )}
    </Link>
  );
}

function SidebarFooter({
  onCloseMobile,
  userName,
  userEmail,
  isUserLoading,
  onSignOut,
  isCollapsed,
}: {
  onCloseMobile?: () => void;
  userName: string | null;
  userEmail: string | null;
  isUserLoading: boolean;
  onSignOut: () => void;
  isCollapsed: boolean;
}) {
  return (
    <div className={cn("mt-auto border-t border-slate-800/60 px-4 py-4", isCollapsed && "px-2")}>
      <div className={cn("flex items-center gap-3", isCollapsed && "flex-col justify-center gap-4")}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/20 text-emerald-400 ring-1 ring-emerald-500/20" title={isCollapsed ? userName ?? "User" : undefined}>
          <User className="h-4 w-4" strokeWidth={1.75} />
        </div>
        {!isCollapsed && (
          <div className="flex-1 overflow-hidden">
            {isUserLoading ? (
              <>
                <div className="h-3 w-24 animate-pulse rounded bg-slate-700/60" />
                <div className="mt-1.5 h-2.5 w-32 animate-pulse rounded bg-slate-800/60" />
              </>
            ) : (
              <>
                <p className="truncate text-xs font-medium text-slate-200">{userName ?? "User"}</p>
                <p className="truncate text-[10px] text-slate-600">{userEmail ?? ""}</p>
              </>
            )}
          </div>
        )}
        <button
          onClick={onSignOut}
          className="group relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-800/60 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
          title={!isCollapsed ? "Sign out" : undefined}
          aria-label="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
          {isCollapsed && (
            <div className="absolute left-full ml-4 hidden rounded-md bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100 z-50 whitespace-nowrap border border-slate-700/50">
              Sign out
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  isProActive,
  onCloseMobile,
  userName,
  userEmail,
  isUserLoading,
  userRole,
  onSignOut,
  isCollapsed,
  onToggleCollapse,
  isMobile,
}: {
  pathname: string;
  isProActive: boolean;
  onCloseMobile?: () => void;
  userName: string | null;
  userEmail: string | null;
  isUserLoading: boolean;
  userRole: string | null;
  onSignOut: () => void;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
}) {
  const filteredItems = NAV_ITEMS.filter(
    (item) => !item.roles || (userRole && item.roles.includes(userRole))
  );
  return (
    <div className="flex h-full flex-col relative">
      <SidebarBrand isCollapsed={isCollapsed} />

      {!isMobile && (
        <button
          onClick={onToggleCollapse}
          className="absolute right-[-12px] top-5 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400 hover:text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      )}

      <div className={cn("px-5 pb-1 pt-2", isCollapsed && "px-0 text-center")}>
        <p className={cn("text-[10px] font-semibold uppercase tracking-widest text-slate-700", isCollapsed && "hidden")}>
          Navigation
        </p>
        {isCollapsed && <div className="h-px bg-slate-800/60 w-1/2 mx-auto mb-2" />}
      </div>

      <nav className={cn("flex-1 space-y-0.5 overflow-y-auto px-3 py-2", isCollapsed && "px-2")} aria-label="Main navigation">
        {filteredItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))}
            isProActive={isProActive}
            onClick={onCloseMobile}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      <SidebarFooter
        onCloseMobile={onCloseMobile}
        userName={userName}
        userEmail={userEmail}
        isUserLoading={isUserLoading}
        onSignOut={onSignOut}
        isCollapsed={isCollapsed}
      />
    </div>
  );
}

export function Sidebar({
  pathname,
  isProActive,
  userName,
  userEmail,
  isUserLoading,
  userRole,
  onSignOut,
  mobileOpen,
  setMobileOpen,
  onCollapseChange,
}: {
  pathname: string;
  isProActive: boolean;
  userName: string | null;
  userEmail: string | null;
  isUserLoading: boolean;
  userRole: string | null;
  onSignOut: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onCollapseChange: (collapsed: boolean) => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("opedox:sidebar-collapsed");
    if (saved !== null) {
      const parsed = saved === "true";
      setIsCollapsed(parsed);
      onCollapseChange(parsed);
    }
  }, [onCollapseChange]);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapseChange(newState);
    localStorage.setItem("opedox:sidebar-collapsed", String(newState));
  };

  if (!mounted) {
    return (
      <>
        {/* Mobile backdrop placeholder */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
        {/* Desktop Sidebar placeholder */}
        <aside
          className={cn(
            "hidden lg:flex lg:flex-col print:hidden",
            "fixed inset-y-0 left-0 z-20",
            "border-r border-slate-800/80",
            "bg-slate-900/40 backdrop-blur-xl",
            "w-64"
          )}
        />
        {/* Mobile Sidebar placeholder */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 lg:hidden print:hidden",
            "border-r border-slate-800/80",
            "bg-slate-900/95 backdrop-blur-xl",
            "transition-transform duration-300 ease-in-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
          aria-label="Mobile navigation"
        />
      </>
    );
  }

  return (
    <>
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
          "fixed inset-y-0 left-0 z-40 w-64 lg:hidden print:hidden",
          "border-r border-slate-800/80",
          "bg-slate-900/95 backdrop-blur-xl",
          "transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Mobile navigation"
      >
        <button
          className="absolute right-3 top-[1.1rem] flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800/60 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent
          pathname={pathname}
          isProActive={isProActive}
          onCloseMobile={() => setMobileOpen(false)}
          userName={userName}
          userEmail={userEmail}
          isUserLoading={isUserLoading}
          userRole={userRole}
          onSignOut={onSignOut}
          isCollapsed={false}
          isMobile={true}
        />
      </aside>

      {/* ── Desktop sidebar (fixed) ── */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col print:hidden",
          "fixed inset-y-0 left-0 z-20",
          "border-r border-slate-800/80",
          "bg-slate-900/40 backdrop-blur-xl",
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-64"
        )}
        aria-label="Desktop navigation"
      >
        <SidebarContent
          pathname={pathname}
          isProActive={isProActive}
          userName={userName}
          userEmail={userEmail}
          isUserLoading={isUserLoading}
          userRole={userRole}
          onSignOut={onSignOut}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>
    </>
  );
}
