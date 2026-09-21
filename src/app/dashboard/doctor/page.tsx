'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import PremiumPrescription from '@/components/PremiumPrescription';
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
  Trash2,
  Plus,
  MessageSquare,
  Thermometer,
  Weight,
  Send,
  Zap,
  ClipboardList,
  ChevronRight,
  AlertCircle,
  FileText,
  Lock,
  BookmarkPlus,
  BookOpen,
  X,
  FlaskConical,
  Printer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/lib/subscription-context';
import { updateTokenStatusAction } from '@/actions/queue';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ConsultationToken {
  id: string;
  token_number: number;
  patient_name: string;
  status: string;
  created_at: string;
  clinic_id: string;
  patient_phone?: string;
}

interface MedItem {
  id: string;
  name: string;
  dosage: string;
  duration: string;
  instructions: string;
}

interface Protocol {
  id: string;
  emoji: string;
  label: string;
  accentColor: string;
  meds: Omit<MedItem, 'id'>[];
}

interface RxTemplate {
  id: string;
  clinic_slug: string;
  template_name: string;
  medicines: Omit<MedItem, 'id'>[];
  created_at: string;
}

// Clinic slug — must match the constant in dashboard/layout.tsx
const ACTIVE_CLINIC_SLUG = 'demo-clinic';

// ─── Static Data ──────────────────────────────────────────────────────────────
const PROTOCOLS: Protocol[] = [
  {
    id: 'fever',
    emoji: '🤒',
    label: 'Fever / Flu',
    accentColor: '#f59e0b',
    meds: [
      { name: 'Paracetamol 500mg', dosage: '1-0-1', duration: '3 Days', instructions: 'After meals' },
      { name: 'Antihistamine 10mg', dosage: '0-0-1', duration: '5 Days', instructions: 'Before bed' },
    ],
  },
  {
    id: 'gastritis',
    emoji: '🤢',
    label: 'Gastritis / Acidity',
    accentColor: '#a78bfa',
    meds: [
      { name: 'Omeprazole 20mg', dosage: '1-0-0', duration: '7 Days', instructions: 'Before meals' },
      { name: 'Antacid Syrup 10ml', dosage: '1-1-1', duration: '5 Days', instructions: 'After meals' },
    ],
  },
  {
    id: 'cough',
    emoji: '🫁',
    label: 'Cough / URTI',
    accentColor: '#06b6d4',
    meds: [
      { name: 'Co-Amoxiclav 625mg', dosage: '1-0-1', duration: '5 Days', instructions: 'After meals' },
      { name: 'Cough Syrup 10ml', dosage: '1-1-1', duration: '5 Days', instructions: 'After meals' },
    ],
  },
  {
    id: 'hypertension',
    emoji: '🩺',
    label: 'Hypertension',
    accentColor: '#f87171',
    meds: [
      { name: 'Amlodipine 5mg', dosage: '1-0-0', duration: '30 Days', instructions: 'Morning with water' },
    ],
  },
];

const MED_SUGGESTIONS = [
  'Paracetamol 500mg', 'Paracetamol 1g', 'Ibuprofen 400mg', 'Ibuprofen 600mg',
  'Amoxicillin 500mg', 'Co-Amoxiclav 625mg', 'Azithromycin 500mg', 'Doxycycline 100mg',
  'Omeprazole 20mg', 'Omeprazole 40mg', 'Pantoprazole 40mg', 'Antacid Syrup 10ml',
  'Metformin 500mg', 'Metformin 1g', 'Amlodipine 5mg', 'Amlodipine 10mg',
  'Losartan 50mg', 'Atorvastatin 20mg', 'Cetirizine 10mg', 'Loratadine 10mg',
  'Salbutamol Inhaler', 'Montelukast 10mg', 'Cough Syrup 10ml', 'Vitamin C 500mg',
  'Zinc 20mg', 'Vitamin D3 1000IU', 'Multivitamin', 'Iron + Folic Acid',
  'Metronidazole 400mg', 'Ciprofloxacin 500mg',
];

const ADVICE_OPTIONS = [
  'Take after meals',
  'Drink plenty of water',
  'Avoid cold drinks',
  'Rest for 3 days',
  'Avoid spicy food',
  'Complete full course',
];

const DOSAGE_OPTIONS = ['1-0-0', '0-0-1', '1-0-1', '1-1-0', '1-1-1', '0-1-0', 'SOS'];
const DURATION_OPTIONS = ['1 Day', '3 Days', '5 Days', '7 Days', '10 Days', '14 Days', '30 Days'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

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
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">{label}</p>
        <p className="text-sm font-medium text-slate-100">{value}</p>
      </div>
    </div>
  );
}

// ─── Live Pulse ───────────────────────────────────────────────────────────────
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

// ─── Session Clock ────────────────────────────────────────────────────────────
function SessionClock() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const format = () =>
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTime(format());
    const id = setInterval(() => setTime(format()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-800/60 bg-slate-900/50 px-3 py-2 backdrop-blur-sm">
      <Clock className="h-3.5 w-3.5 shrink-0 text-slate-600" strokeWidth={1.75} />
      <span className="font-mono text-xs tabular-nums text-slate-400">{time}</span>
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
        'px-10 py-20 text-center',
        'shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_24px_48px_rgba(0,0,0,0.4)]',
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-2xl" />
        <motion.div
          animate={{ scale: [1, 1.04, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/[0.07] bg-slate-800/60"
        >
          <Stethoscope className="h-10 w-10 text-emerald-400/50" strokeWidth={1.25} aria-hidden="true" />
        </motion.div>
      </div>

      <div className="space-y-2">
        <h2 className="bg-gradient-to-r from-slate-100 via-white to-slate-300 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
          Waiting for Next Patient
        </h2>
        <p className="text-sm text-slate-400">No patient is currently in consultation.</p>
        <p className="text-xs text-slate-600">This view updates automatically when a patient is called.</p>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <LivePulse />
    </motion.div>
  );
}

// ─── Vitals Panel ─────────────────────────────────────────────────────────────
function VitalsPanel({ patientName }: { patientName: string }) {
  const vitals = [
    { icon: HeartPulse, label: 'Blood Pressure', value: '120 / 80', unit: 'mmHg', color: '#f87171' },
    { icon: Thermometer, label: 'Temperature', value: '98.6', unit: '°F', color: '#f59e0b' },
    { icon: Weight, label: 'Weight', value: '70', unit: 'kg', color: '#06b6d4' },
    { icon: ClipboardList, label: 'Chief Complaint', value: 'General OPD', unit: '', color: '#a78bfa' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-white/[0.07] bg-slate-900/60 p-4 backdrop-blur-xl"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          Vitals &amp; Quick Notes
        </span>
        <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-500">
          Demo
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {vitals.map(({ icon: Icon, label, value, unit, color }) => (
          <div
            key={label}
            className="flex items-center gap-2.5 rounded-xl border border-slate-800/50 bg-slate-950/40 px-3 py-2.5"
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${color}18`, border: `1px solid ${color}28` }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color }} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 truncate">{label}</p>
              <p className="text-xs font-semibold text-slate-200">
                {value}
                {unit && <span className="ml-0.5 text-[10px] font-normal text-slate-500">{unit}</span>}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Patient Card (no complete button — moved to ActionFooter) ───────────────
function PatientCard({ token }: { token: ConsultationToken }) {
  const formattedToken = `A-${String(token.token_number).padStart(3, '0')}`;
  const issuedAt = new Date(token.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const issuedDate = new Date(token.created_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <motion.div
      key={token.id}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="flex w-full flex-col gap-4"
    >
      {/* Status banner */}
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

      {/* Main card */}
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-3xl',
          'border border-white/[0.08]',
          'bg-slate-900/60 backdrop-blur-xl',
          'shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_32px_64px_rgba(0,0,0,0.5)]',
        )}
      >
        {/* Animated top accent bar */}
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

        <div className="flex flex-col gap-5 p-6">
          {/* Token hero */}
          <div className="flex items-center gap-4">
            <div className="relative flex flex-col items-center justify-center">
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
                className="relative flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(6,182,212,0.1) 100%)',
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
                  className="text-lg font-black tracking-tighter text-emerald-400"
                >
                  {formattedToken}
                </motion.span>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
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
                  className="text-xl font-bold tracking-tight text-slate-100"
                >
                  {token.patient_name}
                </motion.h2>
              </AnimatePresence>
              <p className="text-xs text-slate-500">
                {issuedDate} at {issuedAt}
              </p>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          {/* Detail grid */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <DetailItem icon={User} label="Patient Name" value={token.patient_name} accent="#10b981" />
            <DetailItem icon={Hash} label="Token No." value={formattedToken} accent="#06b6d4" />
            <DetailItem icon={CalendarClock} label="Issued At" value={`${issuedDate}, ${issuedAt}`} accent="#f59e0b" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Section A: Protocol Chips ─────────────────────────────────────────────────
function ProtocolChips({
  activeId,
  onSelect,
}: {
  activeId: string | null;
  onSelect: (p: Protocol) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-amber-400" strokeWidth={2} />
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Quick Protocols
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {PROTOCOLS.map((p, i) => {
          const isActive = activeId === p.id;
          return (
            <motion.button
              key={p.id}
              id={`protocol-chip-${p.id}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onSelect(p)}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'relative flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5',
                'text-sm font-medium transition-all duration-200',
                'border backdrop-blur-sm',
                isActive
                  ? 'border-white/20 bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                  : 'border-slate-700/50 bg-slate-900/60 text-slate-400 hover:border-slate-600/70 hover:text-slate-200',
              )}
              style={
                isActive
                  ? { borderColor: `${p.accentColor}40`, boxShadow: `0 0 20px ${p.accentColor}18` }
                  : undefined
              }
              aria-pressed={isActive}
            >
              {isActive && (
                <motion.div
                  layoutId="protocol-active-bg"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: `${p.accentColor}14`, border: `1px solid ${p.accentColor}30` }}
                  transition={{ duration: 0.25 }}
                />
              )}
              <span className="relative text-base">{p.emoji}</span>
              <span className="relative whitespace-nowrap">{p.label}</span>
              {isActive && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: p.accentColor, boxShadow: `0 0 6px ${p.accentColor}` }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Rx Template Bar ──────────────────────────────────────────────────────────
function RxTemplateBar({
  templates,
  isLoading,
  onApply,
  onSaveClick,
  hasMeds,
}: {
  templates: RxTemplate[];
  isLoading: boolean;
  onApply: (t: RxTemplate) => void;
  onSaveClick: () => void;
  hasMeds: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2} />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Quick Apply Template
          </span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-9 w-28 animate-pulse rounded-xl border border-slate-800/60 bg-slate-800/40"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Row header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2} />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Quick Apply Template
          </span>
          {templates.length > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-[9px] font-bold text-emerald-400">
              {templates.length}
            </span>
          )}
        </div>
      </div>

      {/* Chip row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <AnimatePresence>
          {templates.length === 0 ? (
            <motion.p
              key="no-templates"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="whitespace-nowrap text-xs text-slate-600"
            >
              No saved templates yet — save your first below.
            </motion.p>
          ) : (
            templates.map((t, i) => (
              <motion.button
                key={t.id}
                id={`rx-template-chip-${t.id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ delay: i * 0.05, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => onApply(t)}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.96 }}
                className={cn(
                  'group relative flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2',
                  'border border-emerald-500/25 bg-emerald-500/8 text-emerald-300',
                  'text-xs font-semibold transition-all duration-200',
                  'hover:border-emerald-500/50 hover:bg-emerald-500/15 hover:shadow-[0_0_16px_rgba(16,185,129,0.2)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60',
                )}
                title={`Apply "${t.template_name}" — ${t.medicines.length} med${t.medicines.length !== 1 ? 's' : ''}`}
              >
                <FlaskConical className="h-3 w-3 shrink-0 opacity-70" strokeWidth={2} />
                <span className="max-w-[120px] truncate">{t.template_name}</span>
                <span className="ml-0.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1 py-0.5 text-[9px] font-bold text-emerald-500">
                  {t.medicines.length}
                </span>
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />
    </div>
  );
}

// ─── Save Template Modal ───────────────────────────────────────────────────────
function SaveTemplateModal({
  isOpen,
  isSaving,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setName('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setName('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="modal-panel"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Save Rx Template"
            className={cn(
              'fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2',
              'rounded-2xl border border-white/[0.08]',
              'bg-slate-900/95 backdrop-blur-2xl',
              'p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_32px_64px_rgba(0,0,0,0.7)]',
            )}
          >
            {/* Header */}
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/20 to-teal-500/10">
                  <BookmarkPlus className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Save as Template</h3>
                  <p className="text-[11px] text-slate-500">Reuse this prescription with one click</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-800/60 hover:text-slate-300"
                aria-label="Close modal"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>

            {/* Input */}
            <div className="mb-5 flex flex-col gap-1.5">
              <label
                htmlFor="template-name-input"
                className="text-[11px] font-semibold uppercase tracking-widest text-slate-500"
              >
                Template Name
              </label>
              <input
                ref={inputRef}
                id="template-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                  if (e.key === 'Escape') onClose();
                }}
                placeholder="e.g. Viral Fever, URTI, Gastritis…"
                maxLength={60}
                className={cn(
                  'w-full rounded-xl border border-slate-700/60 bg-slate-800/60',
                  'px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600',
                  'transition-colors focus:border-emerald-500/50 focus:bg-slate-800/80 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.08)]',
                )}
              />
              <p className="text-right text-[10px] text-slate-700">{name.length}/60</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 rounded-xl border border-slate-700/60 bg-transparent py-2.5 text-sm font-medium text-slate-400 transition-colors hover:border-slate-600/80 hover:text-slate-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                id="save-template-confirm-btn"
                onClick={handleSubmit}
                disabled={isSaving || !name.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5',
                  'border border-emerald-500/30 bg-gradient-to-r from-emerald-600/80 to-teal-600/80',
                  'text-sm font-semibold text-white',
                  'transition-all hover:from-emerald-500/90 hover:to-teal-500/90',
                  'shadow-[0_0_16px_rgba(16,185,129,0.2)]',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                )}
              >
                <AnimatePresence mode="wait">
                  {isSaving ? (
                    <motion.span
                      key="saving"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white"
                      />
                      Saving…
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <BookmarkPlus className="h-3.5 w-3.5" strokeWidth={2} />
                      Save Template
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Med Row ──────────────────────────────────────────────────────────────────
function MedRow({
  med,
  index,
  onDelete,
  onChange,
}: {
  med: MedItem;
  index: number;
  onDelete: (id: string) => void;
  onChange: (id: string, field: keyof MedItem, value: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 rounded-xl border border-slate-800/60 bg-slate-900/50 px-3 py-2.5 transition-colors hover:border-slate-700/60 hover:bg-slate-900/70"
    >
      {/* Index + name */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-[10px] font-bold text-emerald-400">
          {index + 1}
        </span>
        <input
          value={med.name}
          onChange={(e) => onChange(med.id, 'name', e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-100 outline-none placeholder:text-slate-600 focus:text-white"
          aria-label={`Medicine name ${index + 1}`}
        />
      </div>

      {/* Dosage */}
      <select
        value={med.dosage}
        onChange={(e) => onChange(med.id, 'dosage', e.target.value)}
        className="cursor-pointer rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-400 outline-none transition-colors hover:bg-cyan-500/15 focus:border-cyan-500/40"
        aria-label={`Dosage for ${med.name}`}
      >
        {DOSAGE_OPTIONS.map((d) => (
          <option key={d} value={d} className="bg-slate-900 text-slate-200">{d}</option>
        ))}
      </select>

      {/* Duration */}
      <select
        value={med.duration}
        onChange={(e) => onChange(med.id, 'duration', e.target.value)}
        className="cursor-pointer rounded-lg border border-slate-700/50 bg-slate-800/60 px-2 py-1 text-[11px] font-medium text-slate-300 outline-none transition-colors hover:bg-slate-800 focus:border-slate-600"
        aria-label={`Duration for ${med.name}`}
      >
        {DURATION_OPTIONS.map((d) => (
          <option key={d} value={d} className="bg-slate-900 text-slate-200">{d}</option>
        ))}
      </select>

      {/* Instructions */}
      <input
        value={med.instructions}
        onChange={(e) => onChange(med.id, 'instructions', e.target.value)}
        className="hidden w-28 rounded-lg border border-slate-700/50 bg-transparent px-2 py-1 text-[11px] text-slate-400 outline-none placeholder:text-slate-600 focus:border-slate-600 focus:text-slate-200 lg:block"
        placeholder="Instructions"
        aria-label={`Instructions for ${med.name}`}
      />

      {/* Delete */}
      <motion.button
        onClick={() => onDelete(med.id)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-all hover:bg-red-500/15 hover:text-red-400 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]"
        aria-label={`Remove ${med.name}`}
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
      </motion.button>
    </motion.div>
  );
}

// ─── Med Builder (Section B) ──────────────────────────────────────────────────
function MedBuilder({
  medications,
  onAdd,
  onDelete,
  onChange,
}: {
  medications: MedItem[];
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
  onChange: (id: string, field: keyof MedItem, value: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () =>
      query.length > 0
        ? MED_SUGGESTIONS.filter((s) => s.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
        : [],
    [query],
  );

  const handleAdd = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Column headers */}
      {medications.length > 0 && (
        <div className="hidden grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-3 lg:grid">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-700">Medicine</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-700">Dosage</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-700">Duration</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-700">Instructions</span>
          <span className="w-7" />
        </div>
      )}

      {/* Med rows */}
      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {medications.length === 0 && (
            <motion.div
              key="empty-meds"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-800/80 py-8 text-sm text-slate-600"
            >
              <AlertCircle className="h-4 w-4 opacity-50" strokeWidth={1.5} />
              <span>No medications added yet. Use a protocol chip or type below.</span>
            </motion.div>
          )}
          {medications.map((med, i) => (
            <MedRow
              key={med.id}
              med={med}
              index={i}
              onDelete={onDelete}
              onChange={onChange}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Autocomplete add bar */}
      <div ref={containerRef} className="relative">
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 transition-colors focus-within:border-emerald-500/40 focus-within:bg-emerald-500/8">
          <Plus className="h-4 w-4 shrink-0 text-emerald-500/70" strokeWidth={2} />
          <input
            ref={inputRef}
            id="med-quick-add-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(filtered.length > 0)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd(query);
              if (e.key === 'Escape') setShowSuggestions(false);
            }}
            placeholder="Type medicine name and press Enter..."
            className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
            autoComplete="off"
          />
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => handleAdd(query)}
              className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/25"
            >
              Add
              <ChevronRight className="h-3 w-3" />
            </motion.button>
          )}
        </div>

        {/* Suggestion dropdown */}
        <AnimatePresence>
          {showSuggestions && filtered.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/95 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl"
            >
              {filtered.map((s, i) => (
                <motion.button
                  key={s}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleAdd(s)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-300 transition-colors hover:bg-slate-800/70 hover:text-white"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-[9px] font-bold text-emerald-400">
                    Rx
                  </span>
                  {s}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Section C: Advice Chips + Notes ──────────────────────────────────────────
function AdviceSection({
  selected,
  notes,
  onToggle,
  onNotesChange,
}: {
  selected: string[];
  notes: string;
  onToggle: (advice: string) => void;
  onNotesChange: (val: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Advice chips */}
      <div className="flex flex-wrap gap-2">
        {ADVICE_OPTIONS.map((advice) => {
          const isSelected = selected.includes(advice);
          return (
            <motion.button
              key={advice}
              id={`advice-chip-${advice.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => onToggle(advice)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all duration-200',
                isSelected
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                  : 'border-slate-700/50 bg-slate-900/50 text-slate-500 hover:border-slate-600/70 hover:text-slate-300',
              )}
              aria-pressed={isSelected}
            >
              <AnimatePresence mode="wait">
                {isSelected ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" strokeWidth={2.5} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="empty"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.15 }}
                    className="h-3 w-3 rounded-full border border-slate-600"
                  />
                )}
              </AnimatePresence>
              {advice}
            </motion.button>
          );
        })}
      </div>

      {/* Custom notes */}
      <div className="relative">
        <textarea
          id="doctor-notes-textarea"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Additional notes or instructions for the patient..."
          rows={3}
          className={cn(
            'w-full resize-none rounded-xl border border-slate-700/50 bg-slate-900/50',
            'px-4 py-3 text-sm text-slate-200 outline-none',
            'placeholder:text-slate-600',
            'transition-colors focus:border-slate-600/80 focus:bg-slate-900/70',
          )}
        />
        <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-700">
          {notes.length}/500
        </span>
      </div>
    </div>
  );
}

// ─── Section D: Action Footer ─────────────────────────────────────────────────
function ActionFooter({
  onSendWhatsApp,
  onComplete,
  onPrintPdf,
  isSending,
  isCompleting,
  successMsg,
}: {
  onSendWhatsApp: () => void;
  onComplete: () => void;
  onPrintPdf: () => void;
  isSending: boolean;
  isCompleting: boolean;
  successMsg: string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Success toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" strokeWidth={2} />
            <p className="text-sm font-medium text-emerald-300">{successMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Send Rx via WhatsApp */}
        <motion.button
          id="doctor-send-whatsapp-btn"
          onClick={onSendWhatsApp}
          disabled={isSending || isCompleting}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'relative overflow-hidden rounded-2xl py-3.5 text-sm font-semibold text-white',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}
          aria-label="Save prescription and send via WhatsApp"
        >
          {/* Glow */}
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{ boxShadow: '0 0 28px rgba(37,211,102,0.4), 0 0 60px rgba(37,211,102,0.2)' }}
          />
          {/* Shimmer */}
          <motion.div
            animate={{ x: ['-110%', '110%'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
            className="pointer-events-none absolute inset-0"
            style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)' }}
          />
          <span className="relative flex items-center justify-center gap-2.5">
            <AnimatePresence mode="wait">
              {isSending ? (
                <motion.span key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                  />
                  Saving Rx&hellip;
                </motion.span>
              ) : (
                <motion.span key="idle-wa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Send Rx via WhatsApp
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </motion.button>

        {/* Complete Consultation */}
        <motion.button
          id="doctor-complete-consultation-btn"
          onClick={onComplete}
          disabled={isSending || isCompleting}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'relative overflow-hidden rounded-2xl py-3.5 text-sm font-semibold text-white',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          aria-label="Complete consultation and clear workspace"
        >
          {/* Glow */}
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{ boxShadow: '0 0 28px rgba(16,185,129,0.4), 0 0 60px rgba(16,185,129,0.2)' }}
          />
          {/* Shimmer */}
          <motion.div
            animate={{ x: ['-110%', '110%'] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'linear', repeatDelay: 1.8 }}
            className="pointer-events-none absolute inset-0"
            style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.22) 50%, transparent 65%)' }}
          />
          <span className="relative flex items-center justify-center gap-2.5">
            <AnimatePresence mode="wait">
              {isCompleting ? (
                <motion.span key="completing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                  />
                  Completing&hellip;
                </motion.span>
              ) : (
                <motion.span key="idle-complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Complete Consultation
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </motion.button>
      </div>

      {/* Download / Print PDF button */}
      <motion.button
        id="doctor-print-pdf-btn"
        onClick={onPrintPdf}
        disabled={isSending || isCompleting}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'flex w-full items-center justify-center gap-2.5 rounded-2xl py-3 text-sm font-semibold',
          'border border-slate-700/60 bg-slate-800/50 text-slate-200',
          'transition-all hover:border-slate-600/80 hover:bg-slate-800/80 hover:text-white',
          'disabled:cursor-not-allowed disabled:opacity-40',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/60',
        )}
        aria-label="Download or print prescription as PDF"
      >
        <Printer className="h-4 w-4" strokeWidth={1.75} />
        📄 Download / Print PDF
      </motion.button>
    </div>
  );
}

// ─── Rx Engine (Right Column — Sections A–D) ──────────────────────────────────
function RxEngine({
  token,
  medications,
  selectedAdvice,
  notes,
  activeProtocol,
  isSending,
  isCompleting,
  successMsg,
  onProtocolSelect,
  onAddMed,
  onDeleteMed,
  onChangeMed,
  onToggleAdvice,
  onNotesChange,
  onSendWhatsApp,
  onComplete,
  onPrintPdf,
  // Template props
  rxTemplates,
  templatesLoading,
  onApplyTemplate,
  onSaveTemplateClick,
  isSavingTemplate,
}: {
  token: ConsultationToken;
  medications: MedItem[];
  selectedAdvice: string[];
  notes: string;
  activeProtocol: string | null;
  isSending: boolean;
  isCompleting: boolean;
  successMsg: string | null;
  onProtocolSelect: (p: Protocol) => void;
  onAddMed: (name: string) => void;
  onDeleteMed: (id: string) => void;
  onChangeMed: (id: string, field: keyof MedItem, value: string) => void;
  onToggleAdvice: (advice: string) => void;
  onNotesChange: (val: string) => void;
  onSendWhatsApp: () => void;
  onComplete: () => void;
  onPrintPdf: () => void;
  // Template props
  rxTemplates: RxTemplate[];
  templatesLoading: boolean;
  onApplyTemplate: (t: RxTemplate) => void;
  onSaveTemplateClick: () => void;
  isSavingTemplate: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex flex-col gap-1 rounded-3xl',
        'border border-white/[0.07]',
        'bg-slate-900/60 backdrop-blur-2xl',
        'shadow-[0_0_50px_rgba(16,185,129,0.06),0_0_0_1px_rgba(255,255,255,0.03)]',
        'overflow-hidden',
      )}
    >
      {/* Engine header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10">
            <Send className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Rapid Rx Engine</h2>
            <p className="text-[11px] text-slate-600">for {token.patient_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">{medications.length} med{medications.length !== 1 ? 's' : ''}</span>
          {medications.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(16,185,129,0.6)]"
            >
              {medications.length}
            </motion.span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-0">
        {/* ── Section A: Templates + Protocols ── */}
        <section className="border-b border-white/[0.05] px-6 py-5 space-y-5">
          {/* Template chips row */}
          <RxTemplateBar
            templates={rxTemplates}
            isLoading={templatesLoading}
            onApply={onApplyTemplate}
            onSaveClick={onSaveTemplateClick}
            hasMeds={medications.length > 0}
          />
          {/* Static protocol chips row */}
          <ProtocolChips activeId={activeProtocol} onSelect={onProtocolSelect} />
        </section>

        {/* Section B */}
        <section className="border-b border-white/[0.05] px-6 py-5">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-cyan-400" strokeWidth={2} />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Prescription Builder
            </span>
          </div>
          <MedBuilder
            medications={medications}
            onAdd={onAddMed}
            onDelete={onDeleteMed}
            onChange={onChangeMed}
          />
          {/* Save as Template button — lives below the medicine list */}
          <motion.button
            id="save-as-template-btn"
            onClick={onSaveTemplateClick}
            disabled={medications.length === 0 || isSavingTemplate}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            className={cn(
              'mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5',
              'border border-emerald-500/25 bg-transparent',
              'text-xs font-semibold text-emerald-500/80 transition-all duration-200',
              'hover:border-emerald-500/50 hover:bg-emerald-500/8 hover:text-emerald-400',
              'hover:shadow-[0_0_16px_rgba(16,185,129,0.1)]',
              'disabled:cursor-not-allowed disabled:opacity-30',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40',
            )}
            aria-label="Save current medicines as a reusable template"
          >
            <BookmarkPlus className="h-3.5 w-3.5" strokeWidth={2} />
            💾 Save current medicines as Template
          </motion.button>
        </section>

        {/* Section C */}
        <section className="border-b border-white/[0.05] px-6 py-5">
          <div className="mb-3 flex items-center gap-2">
            <ClipboardList className="h-3.5 w-3.5 text-violet-400" strokeWidth={2} />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Doctor&apos;s Advice
            </span>
          </div>
          <AdviceSection
            selected={selectedAdvice}
            notes={notes}
            onToggle={onToggleAdvice}
            onNotesChange={onNotesChange}
          />
        </section>

        {/* Section D */}
        <section className="px-6 py-5">
          <ActionFooter
            onSendWhatsApp={onSendWhatsApp}
            onComplete={onComplete}
            onPrintPdf={onPrintPdf}
            isSending={isSending}
            isCompleting={isCompleting}
            successMsg={successMsg}
          />
        </section>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DoctorDashboardPage() {
  // ── Pro subscription gate ────────────────────────────────────────────────
  const { isProActive } = useSubscription();

  // ── Core token state ────────────────────────────────────────────────────────
  const [currentToken, setCurrentToken] = useState<ConsultationToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Rx engine state ─────────────────────────────────────────────────────────
  const [medications, setMedications] = useState<MedItem[]>([]);
  const [selectedAdvice, setSelectedAdvice] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [activeProtocol, setActiveProtocol] = useState<string | null>(null);

  // ── Action loading state ────────────────────────────────────────────────────
  const [isSending, setIsSending] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [rxSuccessMsg, setRxSuccessMsg] = useState<string | null>(null);

  // ── Rx Template state ───────────────────────────────────────────────────────
  const [rxTemplates, setRxTemplates] = useState<RxTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // ── Dynamic doctor / clinic data ────────────────────────────────────────────
  const [doctorFullName, setDoctorFullName] = useState<string | null>(null);
  const [doctorCredentials, setDoctorCredentials] = useState<string | null>(null);
  const [doctorSpecialization, setDoctorSpecialization] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState<string | null>(null);
  const [clinicAddress, setClinicAddress] = useState<string | null>(null);
  const [signatureImageUrl, setSignatureImageUrl] = useState<string | null>(null);

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // ── Helper: clear Rx workspace ──────────────────────────────────────────────
  const clearWorkspace = useCallback(() => {
    setMedications([]);
    setSelectedAdvice([]);
    setNotes('');
    setActiveProtocol(null);
    setRxSuccessMsg(null);
  }, []);

  // ── 1. Fetch active in_consultation token ────────────────────────────────
  const fetchActiveToken = useCallback(async () => {
    const { data, error } = await supabase
      .from('tokens')
      .select('id, token_number, patient_name, status, created_at, clinic_id, patient_phone')
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

  // ── 1b. Fetch Rx Templates ────────────────────────────────────────────────
  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    const { data, error } = await supabase
      .from('rx_templates')
      .select('id, clinic_slug, template_name, medicines, created_at')
      .eq('clinic_slug', ACTIVE_CLINIC_SLUG)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[DoctorDashboard] Error fetching templates:', error.message);
    }
    setRxTemplates((data as RxTemplate[]) ?? []);
    setTemplatesLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchActiveToken();
    fetchTemplates();
  }, [fetchActiveToken, fetchTemplates]);

  // ── Fetch doctor profile + credentials on mount ─────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchDoctorData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled || !user) return;

        // Fetch profile with joined clinic name + address
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, clinics(name, address)')
          .eq('id', user.id)
          .maybeSingle();

        if (cancelled) return;

        if (profile) {
          setDoctorFullName(profile.full_name ?? null);

          // Resolve joined clinic (may be object or array from Supabase FK join)
          const rawClinic = (profile as { clinics?: { name?: string; address?: string } | { name?: string; address?: string }[] }).clinics;
          const resolvedClinic = Array.isArray(rawClinic) ? rawClinic[0] : rawClinic;
          setClinicName(resolvedClinic?.name ?? null);
          setClinicAddress(resolvedClinic?.address ?? null);
        }

        // Fetch credentials from doctors table
        const { data: doctorRow } = await supabase
          .from('doctors')
          .select('qualifications, specialization')
          .eq('id', user.id)
          .maybeSingle();

        if (!cancelled && doctorRow) {
          setDoctorCredentials(doctorRow.qualifications ?? null);
          setDoctorSpecialization(doctorRow.specialization ?? null);
        }

        // Fetch signature from storage
        const { data: signatureData } = await supabase
          .storage
          .from('signatures')
          .getPublicUrl(`${user.id}.png`);
        
        // We'll optimistically assume it might exist and set it. If it fails to load, the <img> tag could break, 
        // but typically getPublicUrl always returns a string, so we'll just check if it's there.
        // Actually, without checking if the file exists, getPublicUrl will return a 404 URL. 
        // We can do a quick check by fetching the image or checking if the file exists in the bucket.
        // For a seamless setup, we'll first check if the file exists in the folder.
        const { data: files } = await supabase.storage.from('signatures').list('', {
          search: `${user.id}.png`
        });
        
        if (!cancelled && files && files.length > 0) {
          setSignatureImageUrl(signatureData.publicUrl);
        }
      } catch (err) {
        console.error('[DoctorDashboard] Error fetching doctor data:', err);
      }
    }

    fetchDoctorData();
    return () => { cancelled = true; };
  }, [supabase]);

  // Keep a ref to latest token for realtime callback
  const currentTokenRef = useRef<ConsultationToken | null>(null);
  currentTokenRef.current = currentToken;

  // ── 2. Real-time subscription ────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('doctor-dashboard-tokens')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tokens' },
        (payload) => {
          const updated = payload.new as ConsultationToken;
          if (updated.status === 'in_consultation') {
            setCurrentToken(updated);
            clearWorkspace();
          } else if (currentTokenRef.current?.id === updated.id) {
            setCurrentToken(null);
            setIsCompleting(false);
            clearWorkspace();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // ── 3. Handlers ──────────────────────────────────────────────────────────
  const handleProtocolSelect = useCallback((protocol: Protocol) => {
    setActiveProtocol(protocol.id);
    setMedications(protocol.meds.map((m) => ({ ...m, id: uid() })));
  }, []);

  const handleAddMed = useCallback((name: string) => {
    setMedications((prev) => [
      ...prev,
      { id: uid(), name, dosage: '1-0-1', duration: '5 Days', instructions: 'After meals' },
    ]);
  }, []);

  const handleDeleteMed = useCallback((id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const handleChangeMed = useCallback((id: string, field: keyof MedItem, value: string) => {
    setMedications((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  }, []);

  const handleToggleAdvice = useCallback((advice: string) => {
    setSelectedAdvice((prev) =>
      prev.includes(advice) ? prev.filter((a) => a !== advice) : [...prev, advice],
    );
  }, []);

  // ── Template handlers ────────────────────────────────────────────────────
  /** Append template medicines to the current list (does not replace). */
  const handleApplyTemplate = useCallback((template: RxTemplate) => {
    setMedications((prev) => [
      ...prev,
      ...template.medicines.map((m) => ({ ...m, id: uid() })),
    ]);
  }, []);

  /** Save current medicine list as a new named template. */
  const handleSaveTemplate = async (name: string) => {
    if (!name.trim() || medications.length === 0) return;
    setIsSavingTemplate(true);

    // Strip client-only `id` field before persisting
    const medicinesPayload = medications.map(({ id: _id, ...rest }) => rest);

    const payload = {
      clinic_slug: ACTIVE_CLINIC_SLUG,
      template_name: name.trim(),
      medicines: medicinesPayload,
    };

    // Optimistic: add a placeholder row immediately so the chip appears
    const optimisticId = uid();
    const optimisticTemplate: RxTemplate = {
      id: optimisticId,
      created_at: new Date().toISOString(),
      ...payload,
    };
    setRxTemplates((prev) => [optimisticTemplate, ...prev]);
    setShowSaveModal(false);

    // Persist to Supabase
    const { data, error } = await supabase
      .from('rx_templates')
      .insert(payload)
      .select('id, created_at')
      .single();

    if (error) {
      console.error('[DoctorDashboard] Failed to save template:', error.message);
      // Rollback the optimistic chip
      setRxTemplates((prev) => prev.filter((t) => t.id !== optimisticId));
    } else {
      // Replace optimistic row with the server-confirmed id + timestamp
      setRxTemplates((prev) =>
        prev.map((t) =>
          t.id === optimisticId
            ? { ...t, id: data.id, created_at: data.created_at }
            : t,
        ),
      );
    }

    setIsSavingTemplate(false);
  };

  const handleSendWhatsApp = async () => {
    if (!currentToken) return;
    setIsSending(true);

    const { data: { user: currentUser } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('prescriptions')
      .insert({
        token_id: currentToken.id,
        patient_name: currentToken.patient_name,
        clinic_id: currentToken.clinic_id,
        // Stamp the doctor's auth uid so the public Rx page can look up credentials
        // without requiring the patient to be logged in.
        doctor_id: currentUser?.id ?? null,
        medications: medications,
        advice: selectedAdvice,
        notes: notes,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[DoctorDashboard] Failed to save prescription:', error.message);
      setIsSending(false);
      return;
    }

    const rxUrl = `${window.location.origin}/rx/${data.id}`;

    const docName = doctorFullName || 'Doctor';
    const docQuals = doctorCredentials ? `, ${doctorCredentials}` : '';
    const clinicPart = clinicName ? `, at ${clinicName}` : '';

    const encodedMessage = encodeURIComponent(
      `Hello ${currentToken.patient_name},\n\nYour verified digital prescription from ${docName}${docQuals}${clinicPart} is now available.\n\n📄 View and download your secure prescription here:\n${rxUrl}\n\nWishing you good health!\n\n-- Powered by Opedox 🚀`
    );

    // ── 1. Format phone to international standard ──────────────────────────
    let rawPhone = currentToken.patient_phone?.replace(/\D/g, '') ?? '';
    if (rawPhone.startsWith('0')) {
      rawPhone = '92' + rawPhone.slice(1); // 03334279261 → 923334279261
    }
    const cleanPhone = rawPhone;

    // ── 2. Smart device detection ──────────────────────────────────────────
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // ── 3. Frictionless URL routing ────────────────────────────────────────
    try {
      if (!cleanPhone) {
        // No phone on file — fallback to generic WhatsApp share dialog
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
      } else if (isMobile) {
        // Native deep-link: instantly opens WhatsApp app
        window.location.href = `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`;
      } else {
        // Desktop: go straight to WhatsApp Web, skipping the Meta landing page
        window.open(
          `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`,
          '_blank',
        );
      }
    } catch (routingErr) {
      console.error('[DoctorDashboard] WhatsApp routing error:', routingErr);
    }

    setRxSuccessMsg('Prescription saved! WhatsApp opened successfully.');
    setTimeout(() => setRxSuccessMsg(null), 5000);
    setIsSending(false);
  };

  const handleComplete = async () => {
    if (!currentToken) return;
    setIsCompleting(true);

    const { error } = await updateTokenStatusAction(currentToken.id, 'completed');

    if (error) {
      console.error('[DoctorDashboard] Failed to complete consultation:', error.message);
      setIsCompleting(false);
      return;
    }

    // Optimistically clear — realtime UPDATE will also fire
    setCurrentToken(null);
    setIsCompleting(false);
    clearWorkspace();
  };

  // ── Print handler ─────────────────────────────────────────────────────────
  const handlePrintPdf = useCallback(() => {
    window.print();
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Print-only prescription overlay ─────────────────────────────────
          Hidden on screen (hidden), visible only when printing (print:block).
          The entire dashboard wrapper below has print:hidden so this is the
          only thing the printer sees.
      ── */}
      {currentToken && (
        /* This wrapper controls display only. The #print-prescription ID
           lives inside PremiumPrescription itself — it is the CSS target. */
        <div className="hidden print:block">
          <PremiumPrescription
            patientName={currentToken.patient_name}
            medications={medications}
            advice={selectedAdvice}
            notes={notes}
            createdAt={currentToken.created_at}
            {...(doctorFullName ? { doctorName: doctorFullName } : {})}
            {...(doctorCredentials ? { doctorCredentials } : {})}
            {...(doctorSpecialization ? { doctorSpecialization } : {})}
            {...(clinicName ? { clinicName } : {})}
            {...(clinicAddress ? { clinicAddress } : {})}
            doctorSignatureName={doctorFullName ?? undefined}
            {...(signatureImageUrl ? { signatureImageUrl } : {})}
          />
        </div>
      )}



    <div className="flex min-h-full flex-col gap-6 print:hidden">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/20 to-teal-500/10">
              <HeartPulse className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
            </span>
            <h1 className="text-xl font-semibold tracking-tight text-slate-100">
              Rapid Rx Command Center
            </h1>
          </div>
          <p className="pl-10 text-sm text-slate-500">
            AI-assisted prescription engine — live consultation view.
          </p>
        </div>
        <SessionClock />
      </div>

      {/* Accent rule */}
      <div className="h-px bg-gradient-to-r from-emerald-500/20 via-slate-800/60 to-transparent" />

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4 text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-500/60" />
            <p className="text-sm">Connecting to queue&hellip;</p>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {!currentToken ? (
            <EmptyState key="empty-state" />
          ) : (
            <motion.div
              key={`active-${currentToken.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12"
            >
              {/* ── Left column: Patient Panel (4 cols) ── */}
              <div className="flex flex-col gap-4 lg:col-span-4">
                <AnimatePresence mode="wait">
                  <PatientCard key={currentToken.id} token={currentToken} />
                </AnimatePresence>
                <VitalsPanel patientName={currentToken.patient_name} />
              </div>

              {/* ── Right column: Rx Engine (8 cols) ── */}
              <div className="lg:col-span-8">
                {isProActive ? (
                  <>
                    {/* Save Template Modal — rendered at this level so it overlays correctly */}
                    <SaveTemplateModal
                      isOpen={showSaveModal}
                      isSaving={isSavingTemplate}
                      onClose={() => setShowSaveModal(false)}
                      onSave={handleSaveTemplate}
                    />
                    <RxEngine
                      token={currentToken}
                      medications={medications}
                      selectedAdvice={selectedAdvice}
                      notes={notes}
                      activeProtocol={activeProtocol}
                      isSending={isSending}
                      isCompleting={isCompleting}
                      successMsg={rxSuccessMsg}
                      onProtocolSelect={handleProtocolSelect}
                      onAddMed={handleAddMed}
                      onDeleteMed={handleDeleteMed}
                      onChangeMed={handleChangeMed}
                      onToggleAdvice={handleToggleAdvice}
                      onNotesChange={setNotes}
                      onSendWhatsApp={handleSendWhatsApp}
                      onComplete={handleComplete}
                      onPrintPdf={handlePrintPdf}
                      rxTemplates={rxTemplates}
                      templatesLoading={templatesLoading}
                      onApplyTemplate={handleApplyTemplate}
                      onSaveTemplateClick={() => setShowSaveModal(true)}
                      isSavingTemplate={isSavingTemplate}
                    />
                  </>
                ) : (
                  // ── Pro Gate ──
                  <div
                    id="rx-engine-pro-gate"
                    className={cn(
                      'flex flex-col items-center justify-center gap-5 rounded-3xl',
                      'border border-rose-500/20',
                      'bg-slate-900/60 backdrop-blur-2xl',
                      'px-8 py-16 text-center',
                      'shadow-[0_0_50px_rgba(225,29,72,0.06),0_0_0_1px_rgba(255,255,255,0.03)]',
                      'min-h-[420px]',
                    )}
                  >
                    {/* Lock icon with glow */}
                    <div className="relative flex h-20 w-20 items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-rose-500/15 blur-2xl" />
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-rose-500/20 bg-slate-800/80">
                        <Lock className="h-9 w-9 text-rose-400" strokeWidth={1.5} />
                      </div>
                    </div>

                    {/* Copy */}
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold tracking-tight text-slate-100">
                        Rapid Rx Engine
                      </h2>
                      <p className="text-sm text-slate-400">
                        The AI-assisted prescription builder is a Pro feature.
                      </p>
                    </div>

                    {/* Badge */}
                    <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-sm font-semibold text-rose-400">
                      <Lock className="h-3.5 w-3.5" strokeWidth={2} />
                      Pro Feature
                    </span>

                    {/* CTA */}
                    <a
                      id="rx-gate-cta-btn"
                      href="https://wa.me/923000000000?text=I%20need%20to%20renew%20my%20Opedox%20Pro%20subscription"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'mt-2 rounded-xl px-5 py-2.5 text-sm font-bold',
                        'bg-gradient-to-r from-rose-600 to-red-600 text-white',
                        'shadow-md hover:shadow-rose-500/20 hover:from-rose-500 hover:to-red-500',
                        'transition-all duration-150 hover:scale-[1.03] active:scale-100',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60',
                      )}
                    >
                      Upgrade to Pro
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
    </>
  );
}
