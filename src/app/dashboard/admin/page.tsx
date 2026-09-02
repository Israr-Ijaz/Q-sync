"use client";

import { useEffect, useState } from "react";
import { Users, Clock, Activity, Banknote, Lock } from "lucide-react";
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

// ---------------------------------------------------------------------------
type DbStatus = "waiting" | "in_consultation" | "completed";

interface LiveToken {
  id: string;
  token_number: number;
  patient_name: string;
  status: DbStatus;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Status badge — maps real DB status strings to display labels + colours
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<DbStatus, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-[#25D366]/10 text-[#25D366]" },
  waiting: { label: "Waiting", className: "bg-yellow-500/10 text-yellow-500" },
  in_consultation: { label: "In Consult", className: "bg-blue-500/10 text-blue-500" },
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

/** Build an 8 AM–6 PM hourly skeleton and bucket DB rows into it. */
function buildHourlyChartData(rows: { created_at: string }[]): ChartPoint[] {
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  const labels = ["8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM"];

  const counts: Record<number, number> = {};
  hours.forEach((h) => { counts[h] = 0; });

  rows.forEach((row) => {
    const h = new Date(row.created_at).getHours();
    if (h in counts) counts[h]++;
  });

  return hours.map((h, i) => ({ time: labels[i], patients: counts[h] }));
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminOverviewPage() {
  const { isProActive } = useSubscription();

  const [totalToday, setTotalToday] = useState(0);
  const [activeQueue, setActiveQueue] = useState(0);
  const [cashCount, setCashCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [recentPatients, setRecentPatients] = useState<LiveToken[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartDaysAgo, setChartDaysAgo] = useState(0);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isLoadingChart, setIsLoadingChart] = useState(true);

  // ── Effect 1: Dashboard KPIs + table (runs once on mount) ─────────────────
  useEffect(() => {
    const supabase = createClient();

    async function fetchDashboard() {
      setIsLoadingDashboard(true);

      // Midnight today in local ISO
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      const midnightISO = midnight.toISOString();

      const [
        { count: todayCount },
        { count: waitingCount },
        { data: recent },
        { data: paymentRows },
      ] = await Promise.all([
        // Total patients created today
        supabase
          .from("tokens")
          .select("id", { count: "exact", head: true })
          .gte("created_at", midnightISO),

        // Currently waiting
        supabase
          .from("tokens")
          .select("id", { count: "exact", head: true })
          .eq("status", "waiting"),

        // 5 most recent tokens (any status)
        supabase
          .from("tokens")
          .select("id, token_number, patient_name, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5),

        // Payment mode breakdown for today
        supabase
          .from("tokens")
          .select("id, payment_mode")
          .gte("created_at", midnightISO),
      ]);

      const cash = (paymentRows ?? []).filter((r: { payment_mode?: string }) => r.payment_mode === "cash").length;
      const online = (paymentRows ?? []).filter((r: { payment_mode?: string }) => r.payment_mode === "online_transfer").length;

      setTotalToday(todayCount ?? 0);
      setActiveQueue(waitingCount ?? 0);
      setCashCount(cash);
      setOnlineCount(online);
      setRecentPatients((recent as LiveToken[]) ?? []);
      setIsLoadingDashboard(false);
    }

    fetchDashboard();
  }, []);

  // ── Effect 2: Hourly chart (re-runs whenever chartDaysAgo changes) ─────────
  useEffect(() => {
    const supabase = createClient();

    async function fetchChart() {
      setIsLoadingChart(true);

      // Target date = today minus chartDaysAgo days
      const target = new Date();
      target.setDate(target.getDate() - chartDaysAgo);

      const start = new Date(target);
      start.setHours(0, 0, 0, 0);

      const end = new Date(target);
      end.setHours(23, 59, 59, 999);

      const { data: rows } = await supabase
        .from("tokens")
        .select("created_at")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      setChartData(buildHourlyChartData(rows ?? []));
      setIsLoadingChart(false);
    }

    fetchChart();
  }, [chartDaysAgo]);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 lg:p-10 flex flex-col space-y-8">

      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-bold text-white w-full">Clinic Overview</h1>
        <p className="text-slate-400 mt-2 w-full">
          {new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Card 1 — Total Patients */}
        <div className="w-full bg-slate-900/40 border border-white/5 p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-400">Total Patients Today</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-blue-400">
              <Users className="h-5 w-5" strokeWidth={1.75} />
            </span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold tracking-tight text-white">
              {isLoadingDashboard ? (
                <span className="inline-block h-9 w-16 animate-pulse rounded-lg bg-white/10" />
              ) : totalToday}
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 mb-1">
              +12% from yesterday
            </span>
          </div>
        </div>

        {/* Card 2 — Average Wait Time */}
        <div className="w-full bg-slate-900/40 border border-white/5 p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-400">Average Wait Time</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-orange-400">
              <Clock className="h-5 w-5" strokeWidth={1.75} />
            </span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold tracking-tight text-white">18 min</span>
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
              {isLoadingDashboard ? (
                <span className="inline-block h-9 w-12 animate-pulse rounded-lg bg-white/10" />
              ) : activeQueue}
            </span>
          </div>
        </div>

        {/* Card 4 — Cash in Drawer (Audit) */}
        <div className="relative w-full bg-slate-900/40 border border-white/5 p-6 rounded-2xl flex flex-col gap-4 overflow-hidden">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-400">Cash in Drawer (Audit)</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-emerald-400">
              {isProActive ? (
                <Banknote className="h-5 w-5" strokeWidth={1.75} />
              ) : (
                <Lock className="h-5 w-5 text-rose-400" strokeWidth={1.75} />
              )}
            </span>
          </div>

          {/* Financial data — blurred when Pro is inactive */}
          <div className={isProActive ? undefined : "pointer-events-none select-none blur-md"}>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold tracking-tight text-white">
                {isLoadingDashboard ? (
                  <span className="inline-block h-9 w-24 animate-pulse rounded-lg bg-white/10" />
                ) : (
                  `Rs. ${(cashCount * 1500).toLocaleString()}`
                )}
              </span>
            </div>
            <p className="text-xs text-slate-500 -mt-2">
              {isLoadingDashboard ? (
                <span className="inline-block h-3 w-32 animate-pulse rounded bg-white/10" />
              ) : (
                `${onlineCount} paid via Online Transfer`
              )}
            </p>
          </div>

          {/* Pro gate overlay */}
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
          <h2 className="text-xl font-bold text-white">Patient Flow (Peak Hours)</h2>

          {/* Day selector */}
          <select
            value={chartDaysAgo}
            onChange={(e) => setChartDaysAgo(Number(e.target.value))}
            className="appearance-none rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-slate-300 outline-none focus:border-[#25D366]/50 focus:ring-1 focus:ring-[#25D366]/30 transition-colors cursor-pointer"
          >
            <option value={0}>Today</option>
            <option value={1}>Yesterday</option>
            <option value={2}>2 Days Ago</option>
            <option value={3}>3 Days Ago</option>
            <option value={4}>4 Days Ago</option>
            <option value={5}>5 Days Ago</option>
            <option value={6}>6 Days Ago</option>
            <option value={7}>7 Days Ago</option>
          </select>
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
                  <stop offset="5%" stopColor="#25D366" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#25D366" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
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
              {isLoadingDashboard ? (
                // Skeleton rows while loading
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <span className="inline-block h-4 w-24 animate-pulse rounded bg-white/10" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : recentPatients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                    No activity today yet.
                  </td>
                </tr>
              ) : (
                recentPatients.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${i === recentPatients.length - 1 ? "border-b-0" : ""
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
