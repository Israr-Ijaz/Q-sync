'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Phone,
  Droplets,
  Calendar,
  ShieldAlert,
  Activity,
  Clock,
  Stethoscope,
  Pill,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import VitalsInput from '@/components/clinical/VitalsInput';

// ─── Types ────────────────────────────────────────────────────────────────────
type PatientRow = Record<string, string | null>;
type VisitRow = Record<string, string | null>;

interface Props {
  patient: PatientRow;
  visits: VisitRow[];
  userRole: string | null;
}

// ─── Helper: compute age from DOB ────────────────────────────────────────────
function computeAge(dob: string | null): string {
  if (!dob) return '—';
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return '—';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} yrs`;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  accent = '#10b981',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/50 p-4 backdrop-blur-sm">
      <span
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}
      >
        <Icon className="h-4 w-4" style={{ color: accent }} strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">{label}</p>
        <p className="text-sm font-semibold text-slate-100 truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

// ─── Critical Vitals Banner ───────────────────────────────────────────────────
function CriticalBanner({ allergies, chronicConditions }: { allergies: string | null; chronicConditions: string | null }) {
  const hasAllergies = !!(allergies?.trim());
  const hasChronic = !!(chronicConditions?.trim());

  if (!hasAllergies && !hasChronic) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col gap-3 rounded-2xl border p-4',
        hasAllergies
          ? 'border-red-500/40 bg-red-950/30'
          : 'border-amber-500/40 bg-amber-950/20',
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
            hasAllergies ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400',
          )}
        >
          <AlertCircle className="h-4 w-4" strokeWidth={2} />
        </span>
        <p
          className={cn(
            'text-xs font-bold uppercase tracking-wider',
            hasAllergies ? 'text-red-400' : 'text-amber-400',
          )}
        >
          Critical Medical Information
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {hasAllergies && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
            <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-red-500">
              ⚠ Known Allergies
            </p>
            <p className="text-xs font-medium text-red-200">{allergies}</p>
          </div>
        )}
        {hasChronic && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
            <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-amber-500">
              Chronic Conditions
            </p>
            <p className="text-xs font-medium text-amber-200">{chronicConditions}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Visit Card ───────────────────────────────────────────────────────────────
function VisitCard({ visit, userRole }: { visit: VisitRow; userRole: string | null }) {
  const date = visit.created_at
    ? new Date(visit.created_at).toLocaleDateString([], {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

  const time = visit.created_at
    ? new Date(visit.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const isDoctor = userRole === 'doctor' || userRole === 'admin' || userRole === 'owner';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-5 backdrop-blur-sm"
    >
      {/* Visit Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-200">{date}</p>
            {time && <p className="text-[10px] text-slate-600">{time}</p>}
          </div>
        </div>
        {visit.token_display && (
          <span className="rounded-full border border-slate-700/50 bg-slate-800/60 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400">
            {visit.token_display}
          </span>
        )}
      </div>

      {/* Diagnosis + Medications summary (doctor-only, text display) */}
      {isDoctor && (visit.diagnosis || visit.medications) && (
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {visit.diagnosis && (
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3">
              <div className="mb-1 flex items-center gap-1.5">
                <Stethoscope className="h-3 w-3 text-indigo-400" strokeWidth={1.75} />
                <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-400">Diagnosis</p>
              </div>
              <p className="text-xs font-medium text-slate-200 whitespace-pre-wrap">{visit.diagnosis}</p>
            </div>
          )}
          {visit.medications && (
            <div className="rounded-xl border border-teal-500/20 bg-teal-500/10 p-3">
              <div className="mb-1 flex items-center gap-1.5">
                <Pill className="h-3 w-3 text-teal-400" strokeWidth={1.75} />
                <p className="text-[9px] font-bold uppercase tracking-widest text-teal-400">Medications Given</p>
              </div>
              <p className="text-xs font-medium text-slate-200 whitespace-pre-wrap">{visit.medications}</p>
            </div>
          )}
        </div>
      )}

      {/* VitalsInput in read-only mode */}
      {visit.id && (
        <VitalsInput
          tokenId={visit.id}
          userRole={userRole}
          isEditable={false}
          initialVitals={{
            blood_pressure: visit.blood_pressure ?? '',
            temperature: visit.temperature ?? '',
            weight: visit.weight ?? '',
            chief_complaint: visit.chief_complaint ?? '',
          }}
          initialClinical={{
            allergies: '',
            chronic_conditions: '',
            diagnosis: visit.diagnosis ?? '',
            medications: visit.medications ?? '',
          }}
        />
      )}
    </motion.div>
  );
}

// ─── Empty Visits State ───────────────────────────────────────────────────────
function EmptyVisits() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4 rounded-2xl border border-slate-800/50 bg-slate-900/40 py-14 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800/60 bg-slate-800/40">
        <Stethoscope className="h-6 w-6 text-slate-600" strokeWidth={1.5} />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-400">No previous visits found</p>
        <p className="text-xs text-slate-600">
          This patient has no recorded visit history yet.
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────
export default function PatientProfileClient({ patient, visits, userRole }: Props) {
  const age = useMemo(() => computeAge(patient.date_of_birth ?? patient.dob ?? null), [patient]);

  const allergies = patient.allergies ?? null;
  const chronicConditions = patient.chronic_conditions ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* ── Back Navigation ── */}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/patients"
          className="flex items-center gap-1.5 rounded-xl border border-slate-800/60 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:border-slate-700/80 hover:text-slate-200"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          All Patients
        </Link>
      </div>

      {/* ── Patient Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-3xl border border-white/[0.07] bg-slate-900/60 p-6 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_24px_48px_rgba(0,0,0,0.4)]"
      >
        {/* Avatar + Name row */}
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 ring-1 ring-emerald-500/20">
            <User className="h-6 w-6 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
              {patient.name ?? patient.full_name ?? patient.patient_name ?? 'Unknown Patient'}
            </h1>
            <p className="mt-0.5 text-xs text-slate-600">Patient ID: {patient.id}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={Calendar}
            label="Age"
            value={age}
            accent="#818cf8"
          />
          <StatCard
            icon={Phone}
            label="Contact"
            value={patient.phone ?? patient.patient_phone ?? '—'}
            accent="#06b6d4"
          />
          <StatCard
            icon={Droplets}
            label="Blood Group"
            value={patient.blood_group ?? '—'}
            accent="#f87171"
          />
          <StatCard
            icon={Activity}
            label="Total Visits"
            value={String(visits.length)}
            accent="#10b981"
          />
        </div>
      </motion.div>

      {/* ── Critical Vitals Banner ── */}
      <CriticalBanner allergies={allergies} chronicConditions={chronicConditions} />

      {/* ── Visit History Feed ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-slate-300">Past Visits</h2>
          <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            {visits.length}
          </span>
        </div>

        {visits.length === 0 ? (
          <EmptyVisits />
        ) : (
          <div className="flex flex-col gap-4">
            {visits.map((visit, i) => (
              <motion.div
                key={visit.id ?? i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <VisitCard visit={visit} userRole={userRole} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
