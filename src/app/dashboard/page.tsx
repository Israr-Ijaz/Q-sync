"use client";

import {
  Users,
  Clock,
  Activity,
  CheckCheck,
  Megaphone,
  PenBox,
  ChevronRight,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type PatientStatus = "Waiting" | "Consultation" | "Done";

interface Patient {
  id: string;
  token: string;       // e.g. "#A-012"
  name: string;
  age: number;
  waitMinutes: number;
  status: PatientStatus;
  complaint: string;
}

// ---------------------------------------------------------------------------
// Data — swap `patients` below to toggle between states
// ---------------------------------------------------------------------------

/** ── Active queue — 4 mock patients ── */
const patients: Patient[] = [
  { id: "p1", token: "#A-011", name: "Fatima Ali", age: 38, waitMinutes: 32, status: "Consultation", complaint: "Persistent migraine" },
  { id: "p2", token: "#A-012", name: "Ahmed Khan", age: 45, waitMinutes: 15, status: "Waiting", complaint: "Chest discomfort" },
  { id: "p3", token: "#A-013", name: "Ayesha Siddiqui", age: 29, waitMinutes: 8, status: "Waiting", complaint: "Fever & body aches" },
  { id: "p4", token: "#A-014", name: "Usman Tariq", age: 61, waitMinutes: 3, status: "Waiting", complaint: "Diabetes follow-up" },
];

// Empty queue — uncomment to preview the empty state:
// const patients: Patient[] = [];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Stat card */
function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent: "emerald" | "cyan" | "amber";
  sub?: string;
}) {
  const accentMap = {
    emerald: {
      icon: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/15",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.06)]",
    },
    cyan: {
      icon: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/15",
      glow: "shadow-[0_0_20px_rgba(6,182,212,0.06)]",
    },
    amber: {
      icon: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/15",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.06)]",
    },
  }[accent];

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-5",
        "bg-slate-900/50 backdrop-blur-sm",
        accentMap.border,
        accentMap.glow
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-500">{label}</p>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-xl",
            accentMap.bg,
            accentMap.icon
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
      </div>
      <div>
        <p className="text-3xl font-semibold tracking-tight text-slate-100">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-600">{sub}</p>}
      </div>
    </div>
  );
}

/** Status badge */
function StatusBadge({ status }: { status: PatientStatus }) {
  const map: Record<
    PatientStatus,
    { label: string; className: string }
  > = {
    Waiting: {
      label: "Waiting",
      className:
        "border-amber-500/25 bg-amber-500/10 text-amber-400",
    },
    Consultation: {
      label: "In Consult",
      className:
        "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
    },
    Done: {
      label: "Done",
      className:
        "border-slate-700/50 bg-slate-800/60 text-slate-500",
    },
  };

  const { label, className } = map[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        className
      )}
    >
      <span
        className={cn(
          "mr-1.5 h-1.5 w-1.5 rounded-full",
          status === "Waiting"
            ? "bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.8)]"
            : status === "Consultation"
              ? "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]"
              : "bg-slate-600"
        )}
      />
      {label}
    </span>
  );
}

/** Single patient row card */
function PatientRow({ patient }: { patient: Patient }) {
  return (
    <div
      className={cn(
        "group flex flex-col gap-3 rounded-2xl border border-slate-800/60 p-4",
        "bg-slate-900/40 backdrop-blur-sm",
        "transition-all duration-200",
        "hover:border-slate-700/70 hover:bg-slate-900/60",
        "hover:shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.3)]",
        "sm:flex-row sm:items-center sm:gap-4"
      )}
    >
      {/* Token badge */}
      <div className="flex h-10 min-w-[3.25rem] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 px-2 ring-1 ring-teal-500/20">
        <span className="bg-gradient-to-b from-teal-300 to-cyan-400 bg-clip-text text-xs font-bold tracking-tight text-transparent">
          {patient.token}
        </span>
      </div>

      {/* Patient info */}
      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <p className="truncate text-sm font-semibold text-slate-100">{patient.name}</p>
        <p className="truncate text-xs text-slate-500">
          {patient.age} yrs &middot; {patient.complaint}
        </p>
      </div>

      {/* Wait time */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Timer className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
        <span>{patient.waitMinutes} min</span>
      </div>

      {/* Status */}
      <StatusBadge status={patient.status} />

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Call Next — slate ghost, subtle hover */}
        <button
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-3 py-1.5",
            "border border-slate-700/50 bg-slate-800/50 text-xs font-medium text-slate-400",
            "transition-all duration-150",
            "hover:bg-slate-700/60 hover:border-slate-600/70 hover:text-slate-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600"
          )}
          aria-label={`Call next: ${patient.name}`}
        >
          <Megaphone className="h-3.5 w-3.5" strokeWidth={1.75} />
          Call Next
        </button>
        {/* Prescribe — emerald accent hover */}
        <button
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-3 py-1.5",
            "border border-slate-700/50 bg-slate-800/50 text-xs font-medium text-slate-400",
            "transition-all duration-150",
            "hover:bg-emerald-500/15 hover:border-emerald-500/30 hover:text-emerald-400",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          )}
          aria-label={`Prescribe for ${patient.name}`}
        >
          <PenBox className="h-3.5 w-3.5" strokeWidth={1.75} />
          Prescribe
        </button>
      </div>

      {/* Chevron cue */}
      <ChevronRight className="hidden h-4 w-4 shrink-0 text-slate-700 transition-colors group-hover:text-slate-500 sm:block" />
    </div>
  );
}

/** Empty state */
function EmptyQueueState() {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <div
        className={cn(
          "flex w-full max-w-md flex-col items-center gap-6 rounded-3xl",
          "border border-white/[0.07]",
          "bg-slate-900/50 backdrop-blur-xl",
          "px-10 py-14 text-center",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_24px_48px_rgba(0,0,0,0.4)]"
        )}
      >
        {/* Glowing icon mark */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-500/15 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/[0.07] bg-slate-800/60">
            <CheckCheck
              className="h-9 w-9 text-emerald-400 opacity-40"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Copy */}
        <div className="space-y-2">
          <h2 className="bg-gradient-to-r from-slate-100 via-white to-slate-300 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
            Queue is Clean!
          </h2>
          <p className="text-sm text-slate-400">
            No patients currently waiting.
          </p>
        </div>

        {/* OPD wit */}
        <p className="text-xs italic leading-relaxed text-slate-500">
          &ldquo;It&rsquo;s suspiciously quiet&hellip; Did everyone actually eat
          their apple today? Or are they all stuck in Kalma Chowk traffic?&rdquo;
        </p>

        {/* Thin rule */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* Subtle CTA hint */}
        <p className="text-[11px] uppercase tracking-widest text-slate-700">
          Queue updates in real-time
        </p>
      </div>
    </div>
  );
}

/** Populated queue view */
function PopulatedQueue({ list }: { list: Patient[] }) {
  const waiting = list.filter((p) => p.status === "Waiting").length;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Stat cards ── */}
      <section aria-label="Queue statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total Today"
          value={42}
          accent="cyan"
          sub="Registered patients"
        />
        <StatCard
          icon={Clock}
          label="Currently Waiting"
          value={waiting}
          accent="amber"
          sub={waiting === 1 ? "1 patient in queue" : `${waiting} patients in queue`}
        />
        <StatCard
          icon={Activity}
          label="Avg Wait Time"
          value="18m"
          accent="emerald"
          sub="Across active queue"
        />
      </section>

      {/* ── Queue section header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold text-slate-200">Live Queue</h2>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
            {list.length} active
          </span>
        </div>
        <button className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-300">
          View all
        </button>
      </div>

      {/* ── Patient rows ── */}
      <section aria-label="Patient queue list" className="flex flex-col gap-2.5">
        {list.map((patient) => (
          <PatientRow key={patient.id} patient={patient} />
        ))}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  return (
    <div className="flex min-h-full flex-col gap-6">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-100">
          OPD Queue
        </h1>
        <p className="text-sm text-slate-500">
          Monitor and manage today&rsquo;s outpatient queue in real-time.
        </p>
      </div>

      {/* ── Thin accent rule ── */}
      <div className="h-px bg-gradient-to-r from-emerald-500/20 via-slate-800/60 to-transparent" />

      {/* ── Conditional render ── */}
      {patients.length > 0 ? (
        <PopulatedQueue list={patients} />
      ) : (
        <EmptyQueueState />
      )}
    </div>
  );
}