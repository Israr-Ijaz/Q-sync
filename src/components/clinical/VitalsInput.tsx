'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeartPulse,
  Thermometer,
  Weight,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Activity,
  ShieldAlert,
  Stethoscope,
  Pill,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { saveVitalsAction, getVitalsAction, type VitalsPayload } from '@/actions/vitals';
import { savePatientClinicalAction, getPatientClinicalAction } from '@/actions/patientClinical';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface VitalsData {
  blood_pressure: string;
  temperature: string;
  weight: string;
  chief_complaint: string;
}

export interface ClinicalData {
  allergies: string;
  chronic_conditions: string;
  diagnosis: string;
  medications: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface VitalsInputProps {
  /** Token UUID — the single source of truth. All saves are keyed through it. */
  tokenId: string;
  /** 'receptionist' | 'doctor' | 'admin' | null — controls doctor-only field visibility */
  userRole?: string | null;
  initialVitals?: Partial<VitalsData>;
  initialClinical?: Partial<ClinicalData>;
  isEditable?: boolean;
  onVitalsChange?: (vitals: VitalsData) => void;
}

// ─── Clinical Alert Helpers ───────────────────────────────────────────────────
function parseBP(bp: string): { systolic: number; diastolic: number } | null {
  const match = bp.replace(/\s/g, '').match(/^(\d+)[/\\](\d+)$/);
  if (!match) return null;
  return { systolic: parseInt(match[1], 10), diastolic: parseInt(match[2], 10) };
}

function isBPHigh(bp: string): boolean {
  const parsed = parseBP(bp);
  if (!parsed) return false;
  return parsed.systolic > 140 || parsed.diastolic > 90;
}

function isTempHigh(temp: string): boolean {
  const val = parseFloat(temp);
  if (isNaN(val)) return false;
  return val > 100.4;
}

// ─── Save Status Micro-Indicator ─────────────────────────────────────────────
function SaveIndicator({ status }: { status: SaveStatus }) {
  return (
    <AnimatePresence mode="wait">
      {status === 'saving' && (
        <motion.span
          key="saving"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-1 text-[9px] text-slate-600"
        >
          <Loader2 className="h-2.5 w-2.5 animate-spin" />
          Saving
        </motion.span>
      )}
      {status === 'saved' && (
        <motion.span
          key="saved"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-1 text-[9px] text-emerald-500"
        >
          <CheckCircle2 className="h-2.5 w-2.5" />
          Saved
        </motion.span>
      )}
      {status === 'error' && (
        <motion.span
          key="error"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-1 text-[9px] text-red-500"
        >
          <AlertTriangle className="h-2.5 w-2.5" />
          Error
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// ─── Generic Field Card ───────────────────────────────────────────────────────
function FieldCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  isAlert,
  alertMsg,
  placeholder,
  isEditable,
  saveStatus,
  multiline,
  onChange,
  onBlur,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit?: string;
  color: string;
  isAlert?: boolean;
  alertMsg?: string;
  placeholder: string;
  isEditable: boolean;
  saveStatus: SaveStatus;
  multiline?: boolean;
  onChange: (val: string) => void;
  onBlur: (val: string) => void;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const effectiveColor = isAlert ? '#ef4444' : color;
  const borderClass = isAlert
    ? 'border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
    : isFocused
    ? 'border-slate-600/80 shadow-[0_0_8px_rgba(255,255,255,0.04)]'
    : 'border-slate-800/50';

  return (
    <motion.div
      layout
      className={cn(
        'relative flex flex-col gap-1.5 rounded-xl border bg-slate-950/40 px-3 py-2.5 transition-all duration-200',
        borderClass,
        isAlert && 'bg-red-950/20',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
            style={{ background: `${effectiveColor}18`, border: `1px solid ${effectiveColor}28` }}
          >
            <Icon className="h-3 w-3" style={{ color: effectiveColor }} strokeWidth={1.75} />
          </span>
          <p
            className="text-[9px] font-semibold uppercase tracking-widest"
            style={{ color: isAlert ? '#ef4444' : '#475569' }}
          >
            {label}
          </p>
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      {/* Value */}
      {isEditable ? (
        multiline ? (
          <textarea
            value={value}
            placeholder={placeholder}
            rows={2}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur(e.target.value);
            }}
            className="resize-none bg-transparent text-xs font-medium text-slate-100 outline-none placeholder:text-slate-600 focus:text-white transition-colors"
          />
        ) : (
          <div className="flex items-center gap-1.5">
            <input
              value={value}
              placeholder={placeholder}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={(e) => {
                setIsFocused(false);
                onBlur(e.target.value);
              }}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-100 outline-none placeholder:text-slate-600 focus:text-white"
            />
            {unit && <span className="shrink-0 text-[10px] font-normal text-slate-500">{unit}</span>}
          </div>
        )
      ) : (
        <p className="text-sm font-medium text-slate-200 whitespace-pre-wrap">
          {value || <span className="text-slate-600 font-normal">—</span>}
          {unit && value && (
            <span className="ml-0.5 text-[10px] font-normal text-slate-500">{unit}</span>
          )}
        </p>
      )}

      {/* Alert banner */}
      <AnimatePresence>
        {isAlert && value && alertMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-0.5 flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1">
              <AlertTriangle className="h-2.5 w-2.5 shrink-0 text-red-400" strokeWidth={2} />
              <p className="text-[9px] font-semibold text-red-400">{alertMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Section Divider ─────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="h-px flex-1 bg-slate-800/60" />
      <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-700">
        {children}
      </span>
      <div className="h-px flex-1 bg-slate-800/60" />
    </div>
  );
}

// ─── Main VitalsInput Component ───────────────────────────────────────────────
export default function VitalsInput({
  tokenId,
  userRole,
  initialVitals = {},
  initialClinical = {},
  isEditable = true,
  onVitalsChange,
}: VitalsInputProps) {
  const isDoctor = userRole === 'doctor' || userRole === 'admin';

  // ── Local UI state ────────────────────────────────────────────────────────
  const [vitals, setVitals] = useState<VitalsData>({
    blood_pressure: initialVitals.blood_pressure ?? '',
    temperature: initialVitals.temperature ?? '',
    weight: initialVitals.weight ?? '',
    chief_complaint: initialVitals.chief_complaint ?? '',
  });

  const [clinical, setClinical] = useState<ClinicalData>({
    allergies: initialClinical.allergies ?? '',
    chronic_conditions: initialClinical.chronic_conditions ?? '',
    diagnosis: initialClinical.diagnosis ?? '',
    medications: initialClinical.medications ?? '',
  });

  // ── Per-field save statuses ───────────────────────────────────────────────
  const [vitalStatus, setVitalStatus] = useState<Record<keyof VitalsData, SaveStatus>>({
    blood_pressure: 'idle',
    temperature: 'idle',
    weight: 'idle',
    chief_complaint: 'idle',
  });

  const [clinicalStatus, setClinicalStatus] = useState<Record<keyof ClinicalData, SaveStatus>>({
    allergies: 'idle',
    chronic_conditions: 'idle',
    diagnosis: 'idle',
    medications: 'idle',
  });

  // ── Load vitals from tokens table ─────────────────────────────────────────
  useEffect(() => {
    if (!tokenId) return;
    let cancelled = false;

    (async () => {
      const { data } = await getVitalsAction(tokenId);
      if (cancelled || !data) return;

      setVitals({
        blood_pressure: data.blood_pressure ?? '',
        temperature: data.temperature ?? '',
        weight: data.weight ?? '',
        chief_complaint: data.chief_complaint ?? '',
      });

      // Doctor-only fields also live in the token row
      setClinical((prev) => ({
        ...prev,
        diagnosis: data.diagnosis ?? '',
        medications: data.medications ?? '',
      }));
    })();

    return () => { cancelled = true; };
  }, [tokenId]);

  // ── Load patient-level clinical data (allergies, chronic_conditions) ──────
  // The server action resolves patient phone → patient UUID internally,
  // so we only need to pass tokenId.
  useEffect(() => {
    if (!tokenId || !isEditable) return; // skip for read-only history cards (initialClinical is passed)
    let cancelled = false;

    (async () => {
      const { data } = await getPatientClinicalAction(tokenId);
      if (cancelled || !data) return;
      setClinical((prev) => ({
        ...prev,
        allergies: data.allergies ?? '',
        chronic_conditions: data.chronic_conditions ?? '',
      }));
    })();

    return () => { cancelled = true; };
  }, [tokenId, isEditable]);

  // ── Vitals change handler ─────────────────────────────────────────────────
  const handleVitalChange = useCallback(
    (key: keyof VitalsData, val: string) => {
      setVitals((prev) => {
        const next = { ...prev, [key]: val };
        onVitalsChange?.(next);
        return next;
      });
    },
    [onVitalsChange],
  );

  // ── onBlur: save vitals to tokens table ───────────────────────────────────
  const handleVitalBlur = useCallback(
    async (key: keyof VitalsData, val: string) => {
      if (!tokenId) {
        console.error('[VitalsInput] handleVitalBlur: tokenId is missing — cannot save', key);
        return;
      }
      setVitalStatus((prev) => ({ ...prev, [key]: 'saving' }));
      const payload: VitalsPayload = { [key]: val || null };
      const { error } = await saveVitalsAction(tokenId, payload);
      if (error) {
        console.error('[VitalsInput] Failed to save vitals field', key, '→', error);
      }
      setVitalStatus((prev) => ({ ...prev, [key]: error ? 'error' : 'saved' }));
      setTimeout(() => setVitalStatus((prev) => ({ ...prev, [key]: 'idle' })), 2500);
    },
    [tokenId],
  );

  // ── Clinical change handler ───────────────────────────────────────────────
  const handleClinicalChange = useCallback((key: keyof ClinicalData, val: string) => {
    setClinical((prev) => ({ ...prev, [key]: val }));
  }, []);

  // ── onBlur: save allergies / chronic_conditions to patients table ─────────
  // The server action does: tokenId → patient_phone+clinic_id → patient.id → UPDATE
  const handlePatientFieldBlur = useCallback(
    async (key: 'allergies' | 'chronic_conditions', val: string) => {
      if (!tokenId) {
        console.error('[VitalsInput] handlePatientFieldBlur: tokenId is missing — cannot save', key);
        return;
      }
      setClinicalStatus((prev) => ({ ...prev, [key]: 'saving' }));
      const { error } = await savePatientClinicalAction(tokenId, { [key]: val || null });
      if (error) {
        console.error('[VitalsInput] Failed to save patient field', key, '→', error);
      }
      setClinicalStatus((prev) => ({ ...prev, [key]: error ? 'error' : 'saved' }));
      setTimeout(() => setClinicalStatus((prev) => ({ ...prev, [key]: 'idle' })), 2500);
    },
    [tokenId],
  );

  // ── onBlur: save diagnosis / medications to tokens table (doctor-only) ────
  const handleTokenClinicalBlur = useCallback(
    async (key: 'diagnosis' | 'medications', val: string) => {
      if (!tokenId) {
        console.error('[VitalsInput] handleTokenClinicalBlur: tokenId is missing — cannot save', key);
        return;
      }
      setClinicalStatus((prev) => ({ ...prev, [key]: 'saving' }));
      const payload: VitalsPayload = { [key]: val || null };
      const { error } = await saveVitalsAction(tokenId, payload);
      if (error) {
        console.error('[VitalsInput] Failed to save token clinical field', key, '→', error);
      }
      setClinicalStatus((prev) => ({ ...prev, [key]: error ? 'error' : 'saved' }));
      setTimeout(() => setClinicalStatus((prev) => ({ ...prev, [key]: 'idle' })), 2500);
    },
    [tokenId],
  );

  const bpAlert = isBPHigh(vitals.blood_pressure);
  const tempAlert = isTempHigh(vitals.temperature);
  const hasAlerts = bpAlert || tempAlert;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-white/[0.07] bg-slate-900/60 p-4 backdrop-blur-xl"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Vitals &amp; Clinical Notes
          </span>
          {isEditable && (
            <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-500">
              Live
            </span>
          )}
        </div>

        <AnimatePresence>
          {hasAlerts && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, x: 8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: 8 }}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1"
            >
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                <Activity className="h-3 w-3 text-red-400" />
              </motion.span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-red-400">Alert</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Standard Vitals Grid ── */}
      <div className="grid grid-cols-2 gap-2">
        <FieldCard
          icon={HeartPulse}
          label="Blood Pressure"
          value={vitals.blood_pressure}
          unit="mmHg"
          color="#f87171"
          isAlert={bpAlert}
          alertMsg="HIGH BP — Systolic >140 or Diastolic >90"
          placeholder="120/80"
          isEditable={isEditable}
          saveStatus={vitalStatus.blood_pressure}
          onChange={(v) => handleVitalChange('blood_pressure', v)}
          onBlur={(v) => handleVitalBlur('blood_pressure', v)}
        />
        <FieldCard
          icon={Thermometer}
          label="Temperature"
          value={vitals.temperature}
          unit="°F"
          color="#f59e0b"
          isAlert={tempAlert}
          alertMsg="FEVER — Temperature >100.4°F"
          placeholder="98.6"
          isEditable={isEditable}
          saveStatus={vitalStatus.temperature}
          onChange={(v) => handleVitalChange('temperature', v)}
          onBlur={(v) => handleVitalBlur('temperature', v)}
        />
        <FieldCard
          icon={Weight}
          label="Weight"
          value={vitals.weight}
          unit="kg"
          color="#06b6d4"
          isAlert={false}
          placeholder="70"
          isEditable={isEditable}
          saveStatus={vitalStatus.weight}
          onChange={(v) => handleVitalChange('weight', v)}
          onBlur={(v) => handleVitalBlur('weight', v)}
        />
        <FieldCard
          icon={ClipboardList}
          label="Chief Complaint"
          value={vitals.chief_complaint}
          color="#a78bfa"
          isAlert={false}
          placeholder="Fever, cough, general OPD…"
          isEditable={isEditable}
          saveStatus={vitalStatus.chief_complaint}
          multiline
          onChange={(v) => handleVitalChange('chief_complaint', v)}
          onBlur={(v) => handleVitalBlur('chief_complaint', v)}
        />
      </div>

      {/* ── Patient Medical History (saves to patients table) ── */}
      <div className="mt-3 flex flex-col gap-2">
        <SectionLabel>Patient Medical History</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <FieldCard
            icon={ShieldAlert}
            label="Allergies"
            value={clinical.allergies}
            color="#fb923c"
            isAlert={false}
            placeholder="Penicillin, Sulfa drugs…"
            isEditable={isEditable}
            saveStatus={clinicalStatus.allergies}
            multiline
            onChange={(v) => handleClinicalChange('allergies', v)}
            onBlur={(v) => handlePatientFieldBlur('allergies', v)}
          />
          <FieldCard
            icon={Activity}
            label="Chronic Conditions"
            value={clinical.chronic_conditions}
            color="#34d399"
            isAlert={false}
            placeholder="Diabetes, Hypertension…"
            isEditable={isEditable}
            saveStatus={clinicalStatus.chronic_conditions}
            multiline
            onChange={(v) => handleClinicalChange('chronic_conditions', v)}
            onBlur={(v) => handlePatientFieldBlur('chronic_conditions', v)}
          />
        </div>
      </div>

      {/* ── Doctor-Only Fields (saves to tokens table) ── */}
      {isDoctor && (
        <div className="mt-3 flex flex-col gap-2">
          <SectionLabel>Doctor&apos;s Assessment (Restricted)</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <FieldCard
              icon={Stethoscope}
              label="Diagnosis"
              value={clinical.diagnosis}
              color="#818cf8"
              isAlert={false}
              placeholder={isEditable ? 'Primary diagnosis…' : '—'}
              isEditable={isEditable}
              saveStatus={clinicalStatus.diagnosis}
              multiline
              onChange={(v) => handleClinicalChange('diagnosis', v)}
              onBlur={(v) => handleTokenClinicalBlur('diagnosis', v)}
            />
            <FieldCard
              icon={Pill}
              label="Medications Given"
              value={clinical.medications}
              color="#2dd4bf"
              isAlert={false}
              placeholder={isEditable ? 'Paracetamol 500mg…' : '—'}
              isEditable={isEditable}
              saveStatus={clinicalStatus.medications}
              multiline
              onChange={(v) => handleClinicalChange('medications', v)}
              onBlur={(v) => handleTokenClinicalBlur('medications', v)}
            />
          </div>
        </div>
      )}

      {isEditable && (
        <p className="mt-2.5 text-[9px] text-slate-700">
          Click any field to edit · Auto-saves on blur
        </p>
      )}
    </motion.div>
  );
}
