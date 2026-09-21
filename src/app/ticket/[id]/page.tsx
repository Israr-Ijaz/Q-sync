'use client';

import { use, useState, useEffect, useRef, useCallback } from 'react';
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
  Stethoscope,
} from 'lucide-react';
import { getDoctorAverageConsultationTime } from '@/actions/queue';

// ─── Types ──────────────────────────────────────────────────────────────────
type TicketStatus = 'waiting' | 'almost' | 'called' | 'in_consultation' | 'completed';

interface TicketData {
  tokenNumber: string;
  rawTokenNumber: number;
  patientName: string;
  clinicName: string;
  status: TicketStatus;
  paymentMode: 'pending' | 'cash' | 'online_transfer';
  peopleAhead: number;
  estimatedMinutes: number;
  issuedAt: string;
  clinicId: string;
  doctorId: string;
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

// ─── Payment Status Badge ────────────────────────────────────────────────────
// Shows live payment verification state; updates in real-time with the receptionist.
function PaymentStatusBadge({
  mode,
  tokenNumber,
  rawTokenNumber,
}: {
  mode: 'pending' | 'cash' | 'online_transfer';
  tokenNumber: string;
  rawTokenNumber: number;
}) {
  const verified = mode === 'cash' || mode === 'online_transfer';
  const label =
    mode === 'cash'
      ? '✅ Payment Verified (Cash)'
      : mode === 'online_transfer'
      ? '✅ Payment Verified (Online)'
      : '⏳ Awaiting Payment Verification';

  const waText = encodeURIComponent(
    `Hello, here is my payment screenshot for Token ${tokenNumber} (Token #${rawTokenNumber})`
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full rounded-2xl px-5 py-4"
      style={{
        background: verified ? 'rgba(52,211,153,0.08)' : 'rgba(251,191,36,0.08)',
        border: `1px solid ${verified ? 'rgba(52,211,153,0.25)' : 'rgba(251,191,36,0.3)'}`,
      }}
    >
      {/* Live badge */}
      <AnimatePresence mode="wait">
        <motion.p
          key={mode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="text-sm font-bold text-center"
          style={{ color: verified ? '#34d399' : '#fbbf24' }}
        >
          {label}
        </motion.p>
      </AnimatePresence>

      {/* WhatsApp CTA — only shown while payment is still pending */}
      <AnimatePresence>
        {!verified && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <a
              href={`https://wa.me/923000000000?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #25D366, #128C7E)',
                boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
              }}
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              📱 Send Screenshot on WhatsApp
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function TicketPage({ params }: PageProps) {
  const { id } = use(params);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive] = useState(true);
  const [paymentMode, setPaymentMode] = useState<'pending' | 'cash' | 'online_transfer'>('pending');
  const [isCalledAlert, setIsCalledAlert] = useState(false);

  const prevStatusRef = useRef<TicketStatus | null>(null);

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // 1. Fetch Initial Data & Calculate Position
  useEffect(() => {
    async function fetchTicketDetails() {
      const { data, error } = await supabase
        .from('tokens')
        .select(`patient_name, token_number, status, payment_mode, created_at, clinic_id, doctor_id, clinics (name)`)
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
        .eq('doctor_id', data.doctor_id)
        .in('status', ['waiting', 'almost'])
        .lt('token_number', data.token_number);

      const realPeopleAhead = count || 0;
      const { averageMinutes } = await getDoctorAverageConsultationTime(data.doctor_id);
      const calculatedWaitTime = realPeopleAhead * averageMinutes;

      const rawNum = data.token_number as number;
      setPaymentMode((data.payment_mode as 'pending' | 'cash' | 'online_transfer') ?? 'pending');
      setTicket({
        tokenNumber: `A-${String(rawNum).padStart(3, '0')}`,
        rawTokenNumber: rawNum,
        patientName: data.patient_name,
        clinicName: clinicName,
        status: (data.status as TicketStatus) || 'waiting',
        paymentMode: (data.payment_mode as 'pending' | 'cash' | 'online_transfer') ?? 'pending',
        peopleAhead: realPeopleAhead,
        estimatedMinutes: calculatedWaitTime,
        issuedAt: formattedTime,
        clinicId: data.clinic_id,
        doctorId: data.doctor_id,
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
          const newPaymentMode = (payload.new.payment_mode ?? 'pending') as 'pending' | 'cash' | 'online_transfer';

          // Always update status + payment_mode immediately for instant visual feedback
          setPaymentMode(newPaymentMode);
          setTicket((prev) => prev ? { ...prev, status: newStatus, paymentMode: newPaymentMode } : prev);

          // If the patient is still waiting, re-calculate people ahead
          if (newStatus === 'waiting' || newStatus === 'almost') {
            const current = ticketRef.current;
            if (!current) return;
            // Extract clinic_id from the raw payload (available from DB row)
            const clinicId = payload.new.clinic_id as string;
            const doctorId = payload.new.doctor_id as string;
            const tokenNumber = payload.new.token_number as number;
            const { count } = await supabase
              .from('tokens')
              .select('*', { count: 'exact', head: true })
              .eq('clinic_id', clinicId)
              .eq('doctor_id', doctorId)
              .in('status', ['waiting', 'almost'])
              .lt('token_number', tokenNumber);
            const realPeopleAhead = count ?? 0;
            const { averageMinutes } = await getDoctorAverageConsultationTime(doctorId);
            setTicket((prev) =>
              prev
                ? { ...prev, peopleAhead: realPeopleAhead, estimatedMinutes: realPeopleAhead * averageMinutes }
                : prev
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, supabase]);

  // 3. Clinic-level Queue Sync — catches updates to other tokens so peopleAhead updates live.
  useEffect(() => {
    if (!ticket?.clinicId || !ticket?.doctorId) return;
    
    const channel = supabase
      .channel(`live-queue-${ticket.clinicId}-${ticket.doctorId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tokens', filter: `clinic_id=eq.${ticket.clinicId}` },
        async () => {
          // Another token was updated. Let's recalculate our position if we're still waiting.
          const current = ticketRef.current;
          if (!current || (current.status !== 'waiting' && current.status !== 'almost')) return;
          
          const { count } = await supabase
            .from('tokens')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', current.clinicId)
            .eq('doctor_id', current.doctorId)
            .in('status', ['waiting', 'almost'])
            .lt('token_number', current.rawTokenNumber);
            
          const realPeopleAhead = count ?? 0;
          const { averageMinutes } = await getDoctorAverageConsultationTime(current.doctorId);
          
          setTicket((prev) =>
            prev
              ? { ...prev, peopleAhead: realPeopleAhead, estimatedMinutes: realPeopleAhead * averageMinutes }
              : prev
          );
        }
      )
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [ticket?.clinicId, ticket?.doctorId, supabase]);

  // 4. Haptic Feedback & Alert Overlay
  useEffect(() => {
    if (ticket && prevStatusRef.current) {
      if (
        (prevStatusRef.current === 'waiting' || prevStatusRef.current === 'almost') &&
        (ticket.status === 'in_consultation' || ticket.status === 'called')
      ) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 500]);
        }
        setIsCalledAlert(true);
      }
    }
    if (ticket) {
      prevStatusRef.current = ticket.status;
    }
  }, [ticket?.status]);

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
        {/* Haptic & Visual Alert Overlay */}
        <AnimatePresence>
          {isCalledAlert && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 backdrop-blur-sm"
              style={{ background: 'rgba(16, 185, 129, 0.2)' }}
              onClick={() => setIsCalledAlert(false)}
            >
              <motion.div
                animate={{ 
                  boxShadow: ['0 0 0px 0px rgba(52, 211, 153, 0.8)', '0 0 0px 20px rgba(52, 211, 153, 0)', '0 0 0px 0px rgba(52, 211, 153, 0)'],
                  scale: [1, 1.02, 1]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="bg-[#022c22] border-2 border-emerald-500 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
              >
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BellRing className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-3xl font-black text-white mb-3">It's your turn!</h2>
                <p className="text-emerald-100 text-lg mb-8 leading-relaxed">
                  Please proceed to the Doctor's room now.
                </p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCalledAlert(false);
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold py-4 rounded-xl text-lg transition-colors"
                >
                  Dismiss
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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

          {/* Payment Verification Badge + WhatsApp CTA */}
          <PaymentStatusBadge
            mode={paymentMode}
            tokenNumber={ticket.tokenNumber}
            rawTokenNumber={ticket.rawTokenNumber}
          />

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