'use client';

import { use, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import {
  Wifi,
  Users,
  Clock,
  BellRing,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Activity,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
type TicketStatus = 'waiting' | 'almost' | 'called' | 'in_consultation' | 'completed';

interface TicketData {
  tokenNumber: string;
  patientName: string;
  clinicName: string;
  status: TicketStatus;
  peopleAhead: number;
  estimatedMinutes: number;
  issuedAt: string;
}

type PageProps = {
  params: Promise<{ id: string }>;
};

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  waiting: {
    label: 'Waiting',
    badgeColor: 'rgba(251,191,36,0.15)',
    badgeBorder: 'rgba(251,191,36,0.4)',
    textColor: '#fbbf24',
    glowColor: '#fbbf24',
    icon: Loader2,
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #14101f 100%)',
    tokenGlow: '#6366f1',
  },
  almost: {
    label: 'Almost Ready',
    badgeColor: 'rgba(251,146,60,0.15)',
    badgeBorder: 'rgba(251,146,60,0.45)',
    textColor: '#fb923c',
    glowColor: '#fb923c',
    icon: BellRing,
    gradient: 'linear-gradient(135deg, #1f1108 0%, #0f172a 50%, #1a0a00 100%)',
    tokenGlow: '#fb923c',
  },
  called: {
    label: 'Your Turn!',
    badgeColor: 'rgba(251,146,60,0.2)',
    badgeBorder: 'rgba(251,146,60,0.6)',
    textColor: '#fb923c',
    glowColor: '#fb923c',
    icon: BellRing,
    gradient: 'linear-gradient(135deg, #1f1108 0%, #0f172a 50%, #1a0a00 100%)',
    tokenGlow: '#fb923c',
  },
  // in_consultation is the DB ENUM value — maps to the same "Your Turn!" visuals
  in_consultation: {
    label: 'Your Turn!',
    badgeColor: 'rgba(251,146,60,0.2)',
    badgeBorder: 'rgba(251,146,60,0.6)',
    textColor: '#fb923c',
    glowColor: '#fb923c',
    icon: BellRing,
    gradient: 'linear-gradient(135deg, #1f1108 0%, #0f172a 50%, #1a0a00 100%)',
    tokenGlow: '#fb923c',
  },
  completed: {
    label: 'Completed',
    badgeColor: 'rgba(52,211,153,0.12)',
    badgeBorder: 'rgba(52,211,153,0.4)',
    textColor: '#34d399',
    glowColor: '#34d399',
    icon: CheckCircle2,
    gradient: 'linear-gradient(135deg, #022c22 0%, #0f172a 50%, #011a14 100%)',
    tokenGlow: '#34d399',
  },
};

const STATUS_CYCLE: TicketStatus[] = ['waiting', 'almost', 'called', 'in_consultation', 'completed'];

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TicketStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const isPulsing = status === 'waiting' || status === 'almost' || status === 'called' || status === 'in_consultation';

  return (
    <motion.div
      layout
      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
      style={{
        background: config.badgeColor,
        border: `1px solid ${config.badgeBorder}`,
        color: config.textColor,
      }}
    >
      {isPulsing && (
        <span className="relative flex items-center justify-center">
          <motion.span
            animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
            className="absolute inline-block w-2 h-2 rounded-full"
            style={{ background: config.glowColor }}
          />
          <span className="w-2 h-2 rounded-full" style={{ background: config.glowColor }} />
        </span>
      )}

      {status === 'completed' && <Icon size={14} />}
      {status === 'waiting' && (
        <motion.span animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Icon size={14} />
        </motion.span>
      )}

      <AnimatePresence mode="wait">
        <motion.span
          key={status}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
        >
          {config.label}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Info Stat Card ──────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accentColor }: { icon: React.ElementType; label: string; value: string | number; accentColor: string; }) {
  return (
    <motion.div
      layout
      className="flex flex-col items-center gap-3 rounded-2xl px-5 py-5"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accentColor}22`, border: `1px solid ${accentColor}33` }}>
        <Icon size={18} style={{ color: accentColor }} />
      </div>
      <div className="text-center">
        <AnimatePresence mode="wait">
          <motion.p key={String(value)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="text-2xl font-bold text-white leading-none">
            {value}
          </motion.p>
        </AnimatePresence>
        <p className="text-xs text-zinc-500 mt-1 font-medium uppercase tracking-wider">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function TicketPage({ params }: PageProps) {
  const { id } = use(params);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive] = useState(true);

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // 1. Fetch Initial Data & Calculate Position
  useEffect(() => {
    async function fetchTicketDetails() {
      const { data, error } = await supabase
        .from('tokens')
        .select(`patient_name, token_number, status, created_at, clinic_id, clinics (name)`)
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error("Error fetching ticket:", error);
        setIsLoading(false);
        return;
      }

      const clinicData = Array.isArray(data.clinics) ? data.clinics[0] : data.clinics;
      const clinicName = clinicData?.name || 'Unknown Clinic';

      const date = new Date(data.created_at || new Date());
      const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Calculate real people ahead based on token numbers at the same clinic
      const { count } = await supabase
        .from('tokens')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', data.clinic_id)
        .in('status', ['waiting', 'almost'])
        .lt('token_number', data.token_number);

      const realPeopleAhead = count || 0;
      const calculatedWaitTime = realPeopleAhead * 5;

      setTicket({
        tokenNumber: `A-${String(data.token_number).padStart(3, '0')}`,
        patientName: data.patient_name,
        clinicName: clinicName,
        status: (data.status as TicketStatus) || 'waiting',
        peopleAhead: realPeopleAhead,
        estimatedMinutes: calculatedWaitTime,
        issuedAt: formattedTime,
      });
      setIsLoading(false);
    }

    fetchTicketDetails();
  }, [id, supabase]);

  // Keep a ref so the realtime callback can access the latest ticket fields
  // (clinic_id, token_number) without putting ticket in the dep array.
  const ticketRef = useRef<TicketData | null>(null);
  ticketRef.current = ticket;

  // 2. Live Supabase Sync — subscribed once on mount, stays alive.
  useEffect(() => {
    const channel = supabase
      .channel(`live-ticket-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tokens', filter: `id=eq.${id}` },
        async (payload) => {
          const newStatus = payload.new.status as TicketStatus;

          // Always update status immediately for instant visual feedback
          setTicket((prev) => prev ? { ...prev, status: newStatus } : prev);

          // If the patient is still waiting, re-calculate people ahead
          if (newStatus === 'waiting' || newStatus === 'almost') {
            const current = ticketRef.current;
            if (!current) return;
            // Extract clinic_id from the raw payload (available from DB row)
            const clinicId = payload.new.clinic_id as string;
            const tokenNumber = payload.new.token_number as number;
            const { count } = await supabase
              .from('tokens')
              .select('*', { count: 'exact', head: true })
              .eq('clinic_id', clinicId)
              .in('status', ['waiting', 'almost'])
              .lt('token_number', tokenNumber);
            const realPeopleAhead = count ?? 0;
            setTicket((prev) =>
              prev
                ? { ...prev, peopleAhead: realPeopleAhead, estimatedMinutes: realPeopleAhead * 5 }
                : prev
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading your ticket...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-rose-400">
        <AlertCircle className="w-6 h-6 mr-2" />
        Ticket not found or invalid URL.
      </div>
    );
  }

  // Safe fallback: if the DB sends an unexpected status value, default to 'waiting' theme
  const config = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG['waiting'];

  return (
    <LayoutGroup>
      <motion.div layout className="relative min-h-screen w-full overflow-hidden flex flex-col" animate={{ background: config.gradient }} transition={{ duration: 1.2, ease: 'easeInOut' }}>

        {/* Ambient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div animate={{ background: `radial-gradient(circle at 30% 20%, ${config.tokenGlow}22 0%, transparent 55%)` }} transition={{ duration: 1.2 }} className="absolute inset-0" />
          <motion.div animate={{ background: `radial-gradient(circle at 70% 80%, ${config.tokenGlow}15 0%, transparent 50%)` }} transition={{ duration: 1.2 }} className="absolute inset-0" />
        </div>
        <motion.div animate={{ background: `linear-gradient(to right, transparent, ${config.tokenGlow}77, transparent)` }} transition={{ duration: 1.2 }} className="absolute inset-x-0 top-0 h-px pointer-events-none z-10" />

        {/* Header */}
        <motion.header layout className="relative z-10 flex items-center justify-between px-5 pt-12 pb-4">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-0.5">{ticket.clinicName}</p>
            <h1 className="text-sm font-semibold text-zinc-300">Hello, <span className="text-white">{ticket.patientName}</span></h1>
          </div>
          <motion.div animate={{ opacity: isLive ? 1 : 0.4 }} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#a1a1aa' }}>
            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}><Activity size={11} style={{ color: '#34d399' }} /></motion.span>LIVE
          </motion.div>
        </motion.header>

        {/* Main scrollable content */}
        <main className="relative z-10 flex-1 flex flex-col items-center px-5 pb-36 gap-6 overflow-y-auto">
          <motion.div layout className="w-full flex justify-center pt-2"><StatusBadge status={ticket.status} /></motion.div>

          {/* Central Token Card */}
          <motion.div layout className="w-full rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(40px)', boxShadow: `0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06) inset` }}>
            <motion.div animate={{ background: `linear-gradient(90deg, ${config.tokenGlow}88, ${config.tokenGlow}44, ${config.tokenGlow}88)` }} transition={{ duration: 1.2 }} className="h-1 w-full" />
            <div className="flex flex-col items-center py-10 px-6 gap-3">
              <p className="text-[11px] text-zinc-600 uppercase tracking-[0.2em] font-bold">Your Token</p>
              <div className="relative flex items-center justify-center">
                <motion.div animate={{ boxShadow: [`0 0 40px ${config.tokenGlow}44, 0 0 80px ${config.tokenGlow}22`, `0 0 70px ${config.tokenGlow}77, 0 0 120px ${config.tokenGlow}44`, `0 0 40px ${config.tokenGlow}44, 0 0 80px ${config.tokenGlow}22`], scale: [1, 1.02, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="absolute inset-[-16px] rounded-3xl" />
                <AnimatePresence mode="wait">
                  <motion.h2 key={ticket.tokenNumber} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1, textShadow: [`0 0 30px ${config.tokenGlow}88`, `0 0 60px ${config.tokenGlow}cc`, `0 0 30px ${config.tokenGlow}88`] }} exit={{ scale: 1.1, opacity: 0 }} transition={{ scale: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.3 }, textShadow: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }} className="relative text-[88px] font-black tracking-tight leading-none select-none" style={{ color: config.tokenGlow }}>
                    {ticket.tokenNumber}
                  </motion.h2>
                </AnimatePresence>
              </div>
              <p className="text-xs text-zinc-600 font-medium mt-1">Issued at {ticket.issuedAt}</p>
            </div>
          </motion.div>

          {/* Stats grid */}
          <motion.div layout className="w-full grid grid-cols-2 gap-3">
            <StatCard icon={Users} label="Ahead of you" value={ticket.status === 'completed' || ticket.status === 'called' || ticket.status === 'in_consultation' ? '—' : ticket.peopleAhead} accentColor={config.tokenGlow} />
            <StatCard icon={Clock} label="Est. wait" value={ticket.status === 'completed' ? 'Done' : (ticket.status === 'called' || ticket.status === 'in_consultation') ? 'Now!' : `${ticket.estimatedMinutes}m`} accentColor={config.tokenGlow} />
          </motion.div>

          {/* Status timeline */}
          <motion.div layout className="w-full rounded-2xl px-5 py-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs text-zinc-600 uppercase tracking-widest font-semibold mb-4">Progress</p>
            <div className="relative flex items-center justify-between">
              <div className="absolute inset-x-0 top-3 h-0.5 rounded-full bg-white/5" />
              <motion.div className="absolute top-3 left-0 h-0.5 rounded-full" style={{ background: config.tokenGlow }} animate={{ width: ticket.status === 'waiting' ? '33%' : ticket.status === 'almost' ? '55%' : (ticket.status === 'called' || ticket.status === 'in_consultation') ? '75%' : '100%' }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
              {[{ label: 'Queued', step: 'waiting' }, { label: 'Almost', step: 'almost' }, { label: 'Called', step: 'called' }, { label: 'Done', step: 'completed' }].map(({ label, step }, i) => {
                const isDone = STATUS_CYCLE.indexOf(step as TicketStatus) <= STATUS_CYCLE.indexOf(ticket.status);
                return (
                  <div key={step} className="relative flex flex-col items-center gap-2">
                    <motion.div animate={{ background: isDone ? config.tokenGlow : 'rgba(255,255,255,0.08)', boxShadow: isDone ? `0 0 12px ${config.tokenGlow}66` : 'none' }} transition={{ duration: 0.5, delay: i * 0.08 }} className="w-6 h-6 rounded-full flex items-center justify-center relative z-10">
                      {isDone && <CheckCircle2 size={12} color="#fff" />}
                    </motion.div>
                    <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: isDone ? config.tokenGlow : '#52525b' }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Completed message */}
          <AnimatePresence>
            {ticket.status === 'completed' && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="w-full rounded-2xl p-5 text-center" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}>
                <CheckCircle2 size={24} style={{ color: '#34d399', margin: '0 auto 10px' }} />
                <p className="text-sm text-white font-semibold">Your visit is complete.</p>
                <p className="text-xs text-zinc-500 mt-1">Thank you for visiting {ticket.clinicName}.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Sticky floating action bar */}
        <motion.div layout className="fixed bottom-0 inset-x-0 z-50 px-4 pb-8 pt-4" style={{ background: 'linear-gradient(to top, rgba(10,10,15,0.98) 60%, transparent)' }}>
          <motion.div className="max-w-[480px] mx-auto rounded-2xl px-4 py-3.5 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} className="shrink-0"><Wifi size={18} style={{ color: '#34d399' }} /></motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white leading-tight">Live sync active</p>
              <p className="text-[11px] text-zinc-500 leading-tight mt-0.5 truncate">Do not close this page — your position is being tracked.</p>
            </div>
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.8, repeat: Infinity }}><AlertCircle size={15} style={{ color: '#fbbf24' }} /></motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </LayoutGroup>
  );
}