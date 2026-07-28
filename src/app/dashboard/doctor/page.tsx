'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import {
  Stethoscope,
  User,
  Hash,
  Clock,
  CheckCircle2,
  Loader2,
  Activity,
  HeartPulse,
  CalendarClock,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ConsultationToken {
  id: string;
  token_number: number;
  patient_name: string;
  status: string;
  created_at: string;
  clinic_id: string;
}

// ─── Detail Item ─────────────────────────────────────────────────────────────
function DetailItem({
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
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}
      >
        <Icon className="h-4 w-4" style={{ color: accent }} strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-100">{value}</p>
      </div>
    </div>
  );
}

// ─── Live Pulse Indicator ─────────────────────────────────────────────────────
function LivePulse() {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-400 backdrop-blur-sm">
      <motion.span
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Activity className="h-3 w-3 text-emerald-400" />
      </motion.span>
      LIVE
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0, scale: 0.97, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: -12 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex w-full flex-col items-center gap-6 rounded-3xl',
        'border border-white/[0.06]',
        'bg-slate-900/50 backdrop-blur-xl',
        'px-10 py-16 text-center',
        'shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_24px_48px_rgba(0,0,0,0.4)]',
      )}
    >
      {/* Glowing icon mark */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-2xl" />
        <motion.div
          animate={{ scale: [1, 1.04, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/[0.07] bg-slate-800/60"
        >
          <Stethoscope
            className="h-10 w-10 text-emerald-400/50"
            strokeWidth={1.25}
            aria-hidden="true"
          />
        </motion.div>
      </div>

      {/* Copy */}
      <div className="space-y-2">
        <h2 className="bg-gradient-to-r from-slate-100 via-white to-slate-300 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
          Waiting for Next Patient
        </h2>
        <p className="text-sm text-slate-400">
          No patient is currently in consultation.
        </p>
        <p className="text-xs text-slate-600">
          This view will update automatically when a patient is called.
        </p>
      </div>

      {/* Thin rule */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Real-time hint */}
      <LivePulse />
    </motion.div>
  );
}

// ─── Patient Card ─────────────────────────────────────────────────────────────
function PatientCard({
  token,
  onComplete,
  isCompleting,
}: {
  token: ConsultationToken;
  onComplete: () => void;
  isCompleting: boolean;
}) {
  const formattedToken = `A-${String(token.token_number).padStart(3, '0')}`;

  const issuedAt = new Date(token.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const issuedDate = new Date(token.created_at).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      key={token.id}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="flex w-full flex-col gap-6"
    >
      {/* ── Status banner ── */}
      <div className="flex items-center justify-between">
        <span className="relative inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
          <motion.span
            animate={{ scale: [1, 1.7], opacity: [0.7, 0] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeOut' }}
            className="absolute left-3 inline-block h-2 w-2 rounded-full bg-emerald-400"
          />
          <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
          In Consultation
        </span>
        <LivePulse />
      </div>

      {/* ── Main patient card ── */}
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-3xl',
          'border border-white/[0.08]',
          'bg-slate-900/60 backdrop-blur-xl',
          'shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_32px_64px_rgba(0,0,0,0.5)]',
        )}
      >
        {/* Top accent bar */}
        <motion.div
          animate={{
            background: [
              'linear-gradient(90deg, #10b981aa, #06b6d466, #10b981aa)',
              'linear-gradient(90deg, #06b6d4aa, #10b98166, #06b6d4aa)',
              'linear-gradient(90deg, #10b981aa, #06b6d466, #10b981aa)',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="h-[3px] w-full"
        />

        {/* Card body */}
        <div className="flex flex-col gap-6 p-7">
          {/* Token number hero */}
          <div className="flex items-center gap-5">
            <div className="relative flex flex-col items-center justify-center">
              {/* Glow behind token */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 30px rgba(16,185,129,0.3), 0 0 60px rgba(16,185,129,0.12)',
                    '0 0 50px rgba(16,185,129,0.5), 0 0 90px rgba(16,185,129,0.22)',
                    '0 0 30px rgba(16,185,129,0.3), 0 0 60px rgba(16,185,129,0.12)',
                  ],
                }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-[-8px] rounded-2xl"
              />
              <div
                className="relative flex h-20 w-20 items-center justify-center rounded-2xl"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(6,182,212,0.1) 100%)',
                  border: '1px solid rgba(16,185,129,0.25)',
                }}
              >
                <motion.span
                  animate={{
                    textShadow: [
                      '0 0 20px rgba(16,185,129,0.6)',
                      '0 0 40px rgba(16,185,129,0.9)',
                      '0 0 20px rgba(16,185,129,0.6)',
                    ],
                  }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-2xl font-black tracking-tighter text-emerald-400"
                >
                  {formattedToken}
                </motion.span>
              </div>
            </div>

            {/* Patient name + sub-details */}
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">
                  Current Patient
                </p>
                <Sparkles className="h-3 w-3 text-amber-400/60" strokeWidth={1.5} />
              </div>
              <AnimatePresence mode="wait">
                <motion.h2
                  key={token.patient_name}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="text-2xl font-bold tracking-tight text-slate-100"
                >
                  {token.patient_name}
                </motion.h2>
              </AnimatePresence>
              <p className="text-xs text-slate-500">
                Token issued {issuedDate} at {issuedAt}
              </p>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          {/* ── Detail grid ── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailItem
              icon={User}
              label="Patient Name"
              value={token.patient_name}
              accent="#10b981"
            />
            <DetailItem
              icon={Hash}
              label="Token Number"
              value={formattedToken}
              accent="#06b6d4"
            />

            <DetailItem
              icon={CalendarClock}
              label="Issued At"
              value={`${issuedDate}, ${issuedAt}`}
              accent="#f59e0b"
            />
          </div>
        </div>
      </div>

      {/* ── Complete Consultation CTA ── */}
      <motion.button
        id="doctor-complete-consultation-btn"
        onClick={onComplete}
        disabled={isCompleting}
        whileTap={{ scale: 0.97 }}
        className={cn(
          'relative w-full overflow-hidden rounded-2xl py-4 text-base font-semibold text-white',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-opacity duration-200',
        )}
        style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
        aria-label="Complete consultation and move patient to completed"
      >
        {/* Ambient glow */}
        <motion.div
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ boxShadow: '0 0 28px rgba(16,185,129,0.5), 0 0 60px rgba(16,185,129,0.25)' }}
        />
        {/* Shimmer sweep */}
        <motion.div
          animate={{ x: ['-110%', '110%'] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'linear', repeatDelay: 1.8 }}
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.22) 50%, transparent 65%)',
          }}
        />

        <span className="relative flex items-center justify-center gap-2.5">
          <AnimatePresence mode="wait">
            {isCompleting ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2.5"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                  className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                />
                Completing Consultation&hellip;
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2.5"
              >
                <CheckCircle2 className="h-5 w-5" />
                Complete Consultation
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </motion.button>
    </motion.div>
  );
}

// ─── Session Clock ─────────────────────────────────────────────────────────────
function SessionClock() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const format = () =>
      new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

    setTime(format());
    const id = setInterval(() => setTime(format()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-2 rounded-xl border border-slate-800/60',
        'bg-slate-900/50 px-3 py-2 backdrop-blur-sm',
      )}
    >
      <Clock className="h-3.5 w-3.5 shrink-0 text-slate-600" strokeWidth={1.75} />
      <span className="font-mono text-xs tabular-nums text-slate-400">{time}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DoctorDashboardPage() {
  const [currentToken, setCurrentToken] = useState<ConsultationToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // ── 1. Fetch the active in_consultation token ──────────────────────────────
  const fetchActiveToken = useCallback(async () => {
    const { data, error } = await supabase
      .from('tokens')
      .select('id, token_number, patient_name, status, created_at, clinic_id')
      .eq('status', 'in_consultation')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[DoctorDashboard] Error fetching token:', error.message);
    }

    setCurrentToken(data ?? null);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchActiveToken();
  }, [fetchActiveToken]);

  // Keep a ref so the realtime callback always reads the latest token
  // without needing to re-run (and re-subscribe) the effect.
  const currentTokenRef = useRef<ConsultationToken | null>(null);
  currentTokenRef.current = currentToken;

  // ── 2. Real-time subscription — stable for the component lifetime ─────────
  useEffect(() => {
    const channel = supabase
      .channel('doctor-dashboard-tokens')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tokens' },
        (payload) => {
          const updated = payload.new as ConsultationToken;

          if (updated.status === 'in_consultation') {
            // A patient has just entered consultation — show them instantly
            setCurrentToken(updated);
          } else if (currentTokenRef.current?.id === updated.id) {
            // The current patient's status changed away — clear the screen
            setCurrentToken(null);
            setIsCompleting(false);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // Intentionally empty — we want this channel created once and kept alive.
    // currentTokenRef.current is read inside the callback, so no dep needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // ── 3. Complete Consultation ───────────────────────────────────────────────
  const handleComplete = async () => {
    if (!currentToken) return;

    setIsCompleting(true);

    const { error } = await supabase
      .from('tokens')
      .update({ status: 'completed' })
      .eq('id', currentToken.id);

    if (error) {
      console.error('[DoctorDashboard] Failed to complete consultation:', error.message);
      setIsCompleting(false);
      return;
    }

    // Optimistically clear the UI — the realtime UPDATE event will also fire,
    // but clearing here makes the UX feel instant.
    setCurrentToken(null);
    setIsCompleting(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-full flex-col gap-6">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/20 to-teal-500/10">
              <HeartPulse className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
            </span>
            <h1 className="text-xl font-semibold tracking-tight text-slate-100">
              Doctor&rsquo;s Console
            </h1>
          </div>
          <p className="pl-10 text-sm text-slate-500">
            Current patient in consultation — live view.
          </p>
        </div>

        {/* Live session clock */}
        <SessionClock />
      </div>

      {/* ── Thin accent rule ── */}
      <div className="h-px bg-gradient-to-r from-emerald-500/20 via-slate-800/60 to-transparent" />

      {/* ── Loading skeleton ── */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4 text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-500/60" />
            <p className="text-sm">Connecting to queue&hellip;</p>
          </div>
        </div>
      ) : (
        /* ── Conditionally render patient card or empty state ── */
        <AnimatePresence mode="wait">
          {currentToken ? (
            <PatientCard
              key={currentToken.id}
              token={currentToken}
              onComplete={handleComplete}
              isCompleting={isCompleting}
            />
          ) : (
            <EmptyState key="empty-state" />
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
