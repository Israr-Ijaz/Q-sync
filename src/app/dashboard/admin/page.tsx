"use client";

import { useEffect, useState } from "react";
import { Users, Clock, Activity } from "lucide-react";
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
// Data
// ---------------------------------------------------------------------------
const patientFlowData = [
  { time: "8 AM",  patients: 14 },
  { time: "9 AM",  patients: 28 },
  { time: "10 AM", patients: 42 },
  { time: "11 AM", patients: 55 },
  { time: "12 PM", patients: 38 },
  { time: "1 PM",  patients: 22 },
  { time: "2 PM",  patients: 30 },
  { time: "3 PM",  patients: 48 },
  { time: "4 PM",  patients: 35 },
  { time: "5 PM",  patients: 18 },
  { time: "6 PM",  patients: 9  },
];

// ---------------------------------------------------------------------------
// Types
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
  completed:       { label: "Completed",   className: "bg-[#25D366]/10 text-[#25D366]"  },
  waiting:         { label: "Waiting",     className: "bg-yellow-500/10 text-yellow-500" },
  in_consultation: { label: "In Consult",  className: "bg-blue-500/10 text-blue-500"    },
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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminOverviewPage() {
  const [totalToday,     setTotalToday]     = useState(0);
  const [activeQueue,    setActiveQueue]    = useState(0);
  const [recentPatients, setRecentPatients] = useState<LiveToken[]>([]);
  const [isLoading,      setIsLoading]      = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      setIsLoading(true);

      // Midnight today in local ISO
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      const midnightISO = midnight.toISOString();

      // Run all three queries in parallel
      const [
        { count: todayCount },
        { count: waitingCount },
        { data: recent },
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
      ]);

      setTotalToday(todayCount ?? 0);
      setActiveQueue(waitingCount ?? 0);
      setRecentPatients((recent as LiveToken[]) ?? []);
      setIsLoading(false);
    }

    fetchData();
  }, []);
  return (
    <div className="w-full max-w-7xl mx-auto p-6 lg:p-10 flex flex-col space-y-8">

      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-bold text-white w-full">Clinic Overview</h1>
        <p className="text-slate-400 mt-2 w-full">Wednesday, 12 August 2026</p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">

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
              {isLoading ? (
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
              {isLoading ? (
                <span className="inline-block h-9 w-12 animate-pulse rounded-lg bg-white/10" />
              ) : activeQueue}
            </span>
          </div>
        </div>

      </div>

      {/* ── Area Chart ── */}
      <div className="w-full bg-slate-900/40 border border-white/5 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Patient Flow (Peak Hours)</h2>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={patientFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#25D366" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#25D366" stopOpacity={0}    />
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
              {isLoading ? (
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
