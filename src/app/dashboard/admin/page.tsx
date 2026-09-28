"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Users, Clock, Activity, Banknote, Lock, ChevronDown, RefreshCw } from "lucide-react";
import { useSubscription } from "@/lib/subscription-context";
import { createClient } from "@/utils/supabase/client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ChartPoint {
  time: string;
  patients: number;
}

type DbStatus = "waiting" | "in_consultation" | "completed" | "pending_arrival" | "pending_payment";

interface LiveToken {
  id: string;
  token_number: number;
  patient_name: string;
  status: DbStatus;
  created_at: string;
}

type TimeRange = "Today" | "Last 7 Days" | "This Month";

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<DbStatus, { label: string; className: string }> = {
  completed:       { label: "Completed",   className: "bg-[#25D366]/10 text-[#25D366]" },
  waiting:         { label: "Waiting",     className: "bg-yellow-500/10 text-yellow-500" },
  in_consultation: { label: "In Consult",  className: "bg-blue-500/10 text-blue-500" },
  pending_arrival: { label: "Pending",     className: "bg-slate-500/10 text-slate-400" },
  pending_payment: { label: "Pending Pay", className: "bg-orange-500/10 text-orange-400" },
};

function StatusBadge({ status }: { status: DbStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.waiting;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTokenNumber(n: number) {
  return `Q-${String(n).padStart(3, "0")}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PK", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

/**
 * Returns the [start, end] ISO strings for the given time range.
 */
function getDateRange(range: TimeRange): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString();

  if (range === "Today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start: start.toISOString(), end };
  }

  if (range === "Last 7 Days") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start: start.toISOString(), end };
  }

  // "This Month"
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  return { start: start.toISOString(), end };
}

/**
 * Build hourly buckets (8 AM – 6 PM) for Today,
 * or daily buckets for multi-day ranges.
 */
function buildChartData(
  rows: { created_at: string }[],
  range: TimeRange
): ChartPoint[] {
  if (range === "Today") {
    const hours  = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    const labels = ["8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM"];
    const counts: Record<number, number> = {};
    hours.forEach((h) => { counts[h] = 0; });
    rows.forEach((row) => {
      const h = new Date(row.created_at).getHours();
      if (h in counts) counts[h]++;
    });
    return hours.map((h, i) => ({ time: labels[i], patients: counts[h] }));
  }

  // Day-label buckets
  const dayMap: Record<string, number> = {};
  rows.forEach((row) => {
    const d = new Date(row.created_at).toLocaleDateString("en-PK", {
      month: "short",
      day: "numeric",
    });
    dayMap[d] = (dayMap[d] ?? 0) + 1;
  });

  const { start } = getDateRange(range);
  const startDate = new Date(start);
  const endDate   = new Date();
  const points: ChartPoint[] = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const label = cursor.toLocaleDateString("en-PK", { month: "short", day: "numeric" });
    points.push({ time: label, patients: dayMap[label] ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return points;
}

// Reusable skeleton pulse
function Skeleton({ className }: { className?: string }) {
  return (
    <span className={`inline-block animate-pulse rounded-lg bg-white/10 ${className ?? ""}`} />
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminOverviewPage() {
  const { isProActive } = useSubscription();

  // Stable Supabase client — created once for both queries + Realtime
  const supabase = createClient();

  // ── Time range (drives all queries) ────────────────────────────────────
  const [timeRange,    setTimeRange]    = useState<TimeRange>("Today");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // ── Clinic identity — resolved once on mount for Realtime filter ────────
  const [clinicId, setClinicId] = useState<string | null>(null);

  // ── KPI state ───────────────────────────────────────────────────────────
  const [totalPatients, setTotalPatients] = useState(0);
  const [activeQueue,   setActiveQueue]   = useState(0);
  const [cashDrawer,    setCashDrawer]    = useState(0);
  const [onlineCount,   setOnlineCount]   = useState(0);
  const [avgWaitMin,    setAvgWaitMin]    = useState<number | null>(null);

  // ── Table & chart state ─────────────────────────────────────────────────
  const [recentPatients, setRecentPatients] = useState<LiveToken[]>([]);
  const [chartData,      setChartData]      = useState<ChartPoint[]>([]);

  // ── Loading flags ───────────────────────────────────────────────────────
  const [isLoadingKpis,   setIsLoadingKpis]   = useState(true);
  const [isLoadingChart,  setIsLoadingChart]   = useState(true);
  const [isLoadingRecent, setIsLoadingRecent]  = useState(true);

  // ── Live-update indicator ───────────────────────────────────────────────
  const [isRefreshing, setIsRefreshing] = useState(false);

  // silentRefresh = true → Realtime-triggered re-fetch, skip skeleton flash
  const silentRefresh = useRef(false);

  // ── Fetch — re-runs on timeRange change or Realtime trigger ────────────
  const fetchAll = useCallback(async (silent = false) => {
    if (silent) {
      // Background refresh: show a subtle spinner, no skeleton flash
      setIsRefreshing(true);
    } else {
      setIsLoadingKpis(true);
      setIsLoadingChart(true);
      setIsLoadingRecent(true);
    }

    const { start, end } = getDateRange(timeRange);

    // ── Step 0: Resolve clinic_id + consultation_fee ──────────────────────
    // Re-use already-resolved clinicId when available (subsequent calls).
    // This avoids 2 extra round-trips on every Realtime-triggered refresh.
    let resolvedClinicId = clinicId;
    let consultationFee = 0;

    if (!resolvedClinicId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("clinic_id")
          .eq("id", user.id)
          .single();

        if (profile?.clinic_id) {
          resolvedClinicId = profile.clinic_id as string;
          setClinicId(resolvedClinicId);
        }
      }
    }

    if (resolvedClinicId) {
      const { data: clinic } = await supabase
        .from("clinics")
        .select("consultation_fee")
        .eq("id", resolvedClinicId)
        .single();
      consultationFee = Number(clinic?.consultation_fee) || 0;
    }

    // ── Step 1: Parallel queries ──────────────────────────────────────────────
    type TokenRow = {
      id: string;
      payment_mode: string | null;
      created_at: string;
      started_at: string | null;
    };

    const [
      { count: totalCount },
      { count: waitingCount },
      { data: tokenRows },
      { data: recent },
      { data: chartRows },
    ] = await Promise.all([
      // 1. Total tokens in range (no status filter → includes walk-ins, QR, all)
      supabase
        .from("tokens")
        .select("id", { count: "exact", head: true })
        .gte("created_at", start)
        .lte("created_at", end),

      // 2. Live queue (real-time, range-independent)
      supabase
        .from("tokens")
        .select("id", { count: "exact", head: true })
        .in("status", ["waiting", "in_consultation"]),

      // 3. Token rows for fee + wait-time math — no status/type filter
      //    Fetches ALL token types (walk-in, QR, etc.) for the range
      supabase
        .from("tokens")
        .select("id, payment_mode, created_at, started_at")
        .gte("created_at", start)
        .lte("created_at", end),

      // 4. 5 most recent tokens (activity table)
      supabase
        .from("tokens")
        .select("id, token_number, patient_name, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),

      // 5. Chart rows
      supabase
        .from("tokens")
        .select("created_at")
        .gte("created_at", start)
        .lte("created_at", end),
    ]);

    const rows = (tokenRows ?? []) as TokenRow[];

    // ── Cash in Drawer ────────────────────────────────────────────────────────
    // Revenue-generating tokens:
    //   • payment_mode = 'cash'           → explicitly confirmed cash
    //   • payment_mode = null             → walk-in (no payment recorded yet,
    //                                       but physically present → counts as cash)
    //   • payment_mode = 'pending'        → same treatment as null
    // Excluded: 'online_transfer' (tracked separately)
    let cashTokenCount = 0;
    let onlineTokenCount = 0;

    for (const row of rows) {
      const mode = row.payment_mode;
      if (mode === "online_transfer") {
        onlineTokenCount++;
      } else {
        // null, 'cash', 'pending', 'pending_payment', or any walk-in default
        cashTokenCount++;
      }
    }

    // Defensive multiplication: Number() guards against null/NaN fee
    const drawer = cashTokenCount * (Number(consultationFee) || 0);

    // ── Avg Wait Time ─────────────────────────────────────────────────────────
    // started_at is set by updateTokenStatusAction when → in_consultation
    const seenRows = rows.filter((r) => r.started_at !== null);
    let avgWait: number | null = null;
    if (seenRows.length > 0) {
      const totalMs = seenRows.reduce((acc, r) => {
        return acc + (new Date(r.started_at!).getTime() - new Date(r.created_at).getTime());
      }, 0);
      avgWait = Math.max(0, Math.round(totalMs / seenRows.length / 60_000));
    }

    setTotalPatients(totalCount ?? 0);
    setActiveQueue(waitingCount ?? 0);
    setCashDrawer(drawer);
    setOnlineCount(onlineTokenCount);
    setAvgWaitMin(avgWait);
    setIsLoadingKpis(false);

    setRecentPatients((recent as LiveToken[]) ?? []);
    setIsLoadingRecent(false);

    setChartData(buildChartData(chartRows ?? [], timeRange));
    setIsLoadingChart(false);

    setIsRefreshing(false);
  }, [timeRange, clinicId, supabase]);

  // ── Initial fetch on mount + re-fetch when timeRange changes ───────────
  useEffect(() => {
    silentRefresh.current = false;
    fetchAll(false);
  }, [fetchAll]);

  // ── Realtime subscription — fires on any INSERT or UPDATE to tokens ─────
  useEffect(() => {
    if (!clinicId) return;

    const channel = supabase
      .channel("admin-overview-tokens")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tokens",
          filter: `clinic_id=eq.${clinicId}`,
        },
        () => {
          // New token created — silently refresh all KPIs
          fetchAll(true);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tokens",
          filter: `clinic_id=eq.${clinicId}`,
        },
        () => {
          // Status/payment change — silently refresh
          fetchAll(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clinicId, supabase, fetchAll]);

  const TIME_RANGE_OPTIONS: TimeRange[] = ["Today", "Last 7 Days", "This Month"];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 lg:p-10 flex flex-col space-y-8">

      {/* ── Header + Live indicator + Time Range Dropdown ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">Clinic Overview</h1>
            {/* Live badge — always shown; RefreshCw spins during background refresh */}
            <span className="flex items-center gap-1.5 rounded-full border border-[#25D366]/25 bg-[#25D366]/10 px-2.5 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#25D366] shadow-[0_0_6px_#25D366] animate-pulse" />
              <span className="text-[11px] font-semibold text-[#25D366]">Live</span>
              {isRefreshing && (
                <RefreshCw className="h-3 w-3 text-[#25D366] animate-spin" />
              )}
            </span>
          </div>
          <p className="text-slate-400 mt-1">
            {new Date().toLocaleDateString("en-PK", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="relative">
          <button
            id="time-range-dropdown-btn"
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 hover:border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-[#25D366]/40"
          >
            {timeRange}
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl bg-slate-900 border border-white/10 shadow-2xl z-50 overflow-hidden">
              {TIME_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  id={`time-range-${opt.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => {
                    setTimeRange(opt);
                    setDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    timeRange === opt
                      ? "bg-[#25D366]/15 text-[#25D366] font-semibold"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Card 1 — Total Patients */}
        <div className="w-full bg-slate-900/40 border border-white/5 p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-400">Total Patients</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-blue-400">
              <Users className="h-5 w-5" strokeWidth={1.75} />
            </span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold tracking-tight text-white">
              {isLoadingKpis ? <Skeleton className="h-9 w-16" /> : totalPatients}
            </span>
            {!isLoadingKpis && (
              <span className="mb-1 text-xs text-slate-500 capitalize">
                {timeRange.toLowerCase()}
              </span>
            )}
          </div>
        </div>

        {/* Card 2 — Average Wait Time */}
        <div className="w-full bg-slate-900/40 border border-white/5 p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-400">Avg Wait Time</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-orange-400">
              <Clock className="h-5 w-5" strokeWidth={1.75} />
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-4xl font-bold tracking-tight text-white">
              {isLoadingKpis ? (
                <Skeleton className="h-9 w-24" />
              ) : avgWaitMin === null ? (
                "0 min"
              ) : (
                `${avgWaitMin} min`
              )}
            </span>
            {!isLoadingKpis && (
              <p className="text-xs text-slate-500">
                {avgWaitMin === null
                  ? "No patients seen yet"
                  : "Registration → consultation"}
              </p>
            )}
          </div>
        </div>

        {/* Card 3 — Active in Queue */}
        <div className="w-full bg-slate-900/40 border border-white/5 p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-400">Active in Queue</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-[#25D366]">
              <Activity className="h-5 w-5" strokeWidth={1.75} />
            </span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold tracking-tight text-white">
              {isLoadingKpis ? <Skeleton className="h-9 w-12" /> : activeQueue}
            </span>
            {!isLoadingKpis && (
              <span className="mb-1 inline-flex items-center rounded-full bg-[#25D366]/10 px-2 py-0.5 text-xs font-medium text-[#25D366]">
                Live
              </span>
            )}
          </div>
        </div>

        {/* Card 4 — Cash in Drawer */}
        <div className="relative w-full bg-slate-900/40 border border-white/5 p-6 rounded-2xl flex flex-col gap-4 overflow-hidden">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-400">Cash in Drawer</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
              {isProActive ? (
                <Banknote className="h-5 w-5 text-emerald-400" strokeWidth={1.75} />
              ) : (
                <Lock className="h-5 w-5 text-rose-400" strokeWidth={1.75} />
              )}
            </span>
          </div>

          <div className={isProActive ? undefined : "pointer-events-none select-none blur-md"}>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold tracking-tight text-white">
                {isLoadingKpis ? (
                  <Skeleton className="h-9 w-28" />
                ) : (
                  formatCurrency(cashDrawer)
                )}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isLoadingKpis ? (
                <Skeleton className="h-3 w-32" />
              ) : (
                `${onlineCount} paid via Online Transfer`
              )}
            </p>
          </div>

          {!isProActive && (
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center gap-1.5 pb-5 pt-2">
              <Lock className="h-4 w-4 text-rose-400" strokeWidth={2} />
              <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-400">
                Unlock with Pro
              </span>
            </div>
          )}
        </div>

      </div>

      {/* ── Area Chart ── */}
      <div className="w-full bg-slate-900/40 border border-white/5 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Patient Flow</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {timeRange === "Today"
                ? "Hourly breakdown (8 AM – 6 PM)"
                : "Daily patient volume"}
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
            {timeRange}
          </span>
        </div>

        {isLoadingChart ? (
          <div className="flex items-center justify-center h-[350px]">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#25D366] border-t-transparent" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#25D366" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#25D366" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                interval={timeRange === "This Month" ? 3 : 0}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                  fontSize: "13px",
                }}
                cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="patients"
                stroke="#25D366"
                strokeWidth={2}
                fill="url(#greenGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "#25D366", stroke: "#0f172a", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Recent Activity Table ── */}
      <div className="w-full bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden pb-0">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-xl font-bold text-white">Recent Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Token ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Patient Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingRecent ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : recentPatients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                    No activity yet.
                  </td>
                </tr>
              ) : (
                recentPatients.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${
                      i === recentPatients.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="px-6 py-4 font-mono text-slate-300">{formatTokenNumber(row.token_number)}</td>
                    <td className="px-6 py-4 font-medium text-slate-200">{row.patient_name}</td>
                    <td className="px-6 py-4 text-slate-400">{formatTime(row.created_at)}</td>
                    <td className="px-6 py-4"><StatusBadge status={row.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
