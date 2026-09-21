'use client';

import { use, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Phone,
  ArrowRight,
  Stethoscope,
  CheckCircle2,
  Loader2,
  ChevronRight,
  RefreshCcw,
  Wallet,
  Ticket,
  MessageCircle,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { joinQueue } from '@/actions/patient';

// ─── Types ──────────────────────────────────────────────────────────────────
type PageProps = {
  params: Promise<{ slug: string }>;
};

interface Doctor {
  id: string;
  full_name: string;
  credentials: string | null;
  queue_prefix: string | null;
}

interface ClinicInfo {
  id: string;
  name: string;
  address: string | null;
  whatsapp_number: string | null;
}

// ─── Floating Label Input ───────────────────────────────────────────────────
function FloatingInput({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  icon: Icon,
  disabled,
  accentColor,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ElementType;
  disabled?: boolean;
  accentColor: string;
}) {
  const [focused, setFocused] = useState(false);
  const isFloated = focused || value.length > 0;

  return (
    <div className="relative">
      {focused && (
        <motion.div
          key="glow"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: `0 0 0 2px ${accentColor}66, 0 0 24px ${accentColor}33` }}
        />
      )}
      <div
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors duration-200"
        style={{ color: focused ? accentColor : '#6b7280' }}
      >
        <Icon size={18} />
      </div>
      <motion.label
        htmlFor={id}
        animate={{
          y: isFloated ? -10 : 0,
          scale: isFloated ? 0.78 : 1,
          color: focused ? accentColor : isFloated ? '#9ca3af' : '#6b7280',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="absolute left-12 top-1/2 -translate-y-1/2 origin-left font-medium pointer-events-none z-10"
        style={{ fontSize: '0.9375rem' }}
      >
        {label}
      </motion.label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required
        className="w-full rounded-2xl border px-4 pt-6 pb-3 pl-12 text-base text-white outline-none transition-all duration-200 disabled:opacity-50"
        style={{
          background: 'rgba(255,255,255,0.04)',
          borderColor: focused ? `${accentColor}88` : 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
        }}
        autoComplete="off"
      />
    </div>
  );
}

// ─── Doctor Selection Card ──────────────────────────────────────────────────
function DoctorCard({
  doctor,
  isSelected,
  onSelect,
  accentColor,
}: {
  doctor: Doctor;
  isSelected: boolean;
  onSelect: () => void;
  accentColor: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      className="w-full text-left rounded-2xl border transition-all duration-200 px-5 py-4 flex items-center gap-4 focus:outline-none"
      style={{
        background: isSelected ? `${accentColor}18` : 'rgba(255,255,255,0.04)',
        borderColor: isSelected ? `${accentColor}88` : 'rgba(255,255,255,0.1)',
        boxShadow: isSelected ? `0 0 20px ${accentColor}33` : 'none',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Avatar */}
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${accentColor}22`, border: `1px solid ${accentColor}44` }}
      >
        <Stethoscope size={22} style={{ color: accentColor }} strokeWidth={1.75} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm truncate">{doctor.full_name}</p>
        {doctor.credentials && (
          <p className="text-xs text-zinc-400 mt-0.5 truncate">{doctor.credentials}</p>
        )}
      </div>

      {/* Prefix badge */}
      {doctor.queue_prefix && (
        <span
          className="shrink-0 inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold font-mono"
          style={{
            background: `${accentColor}22`,
            border: `1px solid ${accentColor}44`,
            color: accentColor,
          }}
        >
          {doctor.queue_prefix}
        </span>
      )}

      {/* Chevron */}
      <ChevronRight
        size={16}
        className="shrink-0 transition-transform duration-200"
        style={{
          color: isSelected ? accentColor : '#4b5563',
          transform: isSelected ? 'translateX(2px)' : 'none',
        }}
      />
    </motion.button>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function ClinicPage({ params }: PageProps) {
  const { slug } = use(params);

  const [clinic, setClinic] = useState<ClinicInfo | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Form state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [step, setStep] = useState<'select-doctor' | 'register'>('select-doctor');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = useRef(createClient()).current;
  const accent = '#8b5cf6';

  // ── Fetch clinic + doctors on mount ──────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);

      const { data: clinicData, error: clinicErr } = await supabase
        .from('clinics')
        .select('id, name, address, whatsapp_number')
        .eq('slug', slug.trim().toLowerCase())
        .single();

      if (clinicErr || !clinicData) {
        setFetchError('Clinic not found. Please check the URL.');
        setLoadingData(false);
        return;
      }

      setClinic(clinicData);

      const { data: doctorsData } = await supabase
        .from('profiles')
        .select('id, full_name, credentials, queue_prefix')
        .eq('clinic_id', clinicData.id)
        .eq('role', 'doctor')
        .order('full_name', { ascending: true });

      const activeDoctors = (doctorsData ?? []) as Doctor[];
      setDoctors(activeDoctors);

      // Auto-select if only 1 doctor — skip the select step
      if (activeDoctors.length === 1) {
        setSelectedDoctor(activeDoctors[0]);
        setStep('register');
      }

      setLoadingData(false);
    };

    fetchData();
  }, [slug, supabase]);

  // ── Form submit handler ───────────────────────────────────────────────────
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDoctor || isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await joinQueue(formData, slug, selectedDoctor.id);

      if (result?.error) {
        alert(result.error);
      } else if (result?.success) {
        window.location.href = `/ticket/${result.tokenId}`;
        // Delay resetting state to prevent double-click while navigating
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading / error states ────────────────────────────────────────────────
  const clinicName = clinic
    ? clinic.name
    : decodeURIComponent(slug.replace(/-/g, ' ')).replace(/\b\w/g, (c) => c.toUpperCase()) + ' Clinic';

  // ─── Ambient background (shared across all steps) ────────────────────────
  const Background = () => (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.18, 0.28, 0.18] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-3xl"
        style={{ background: accent }}
      />
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full blur-3xl"
        style={{ background: '#1e1b4b' }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, ${accent}18 0%, transparent 50%), radial-gradient(circle at 80% 20%, #3b82f618 0%, transparent 50%)`,
        }}
      />
    </div>
  );

  if (loadingData) {
    return (
      <div
        className="relative min-h-screen w-full flex items-center justify-center"
        style={{ background: '#0a0a0f' }}
      >
        <Background />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin" style={{ color: accent }} />
          <p className="text-sm text-zinc-400">Loading clinic…</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div
        className="relative min-h-screen w-full flex items-center justify-center px-4"
        style={{ background: '#0a0a0f' }}
      >
        <Background />
        <div className="relative z-10 text-center">
          <p className="text-lg font-semibold text-red-400">{fetchError}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center px-4 py-12"
      style={{ background: '#0a0a0f' }}
    >
      <Background />

      {/* Edge glow lines */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(to right, transparent, ${accent}, transparent)` }}
        />
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: `linear-gradient(to right, transparent, ${accent}88, transparent)` }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center gap-8">
        {/* Clinic header — always visible */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 text-xs font-semibold tracking-wider uppercase"
            style={{ background: `${accent}22`, border: `1px solid ${accent}44`, color: accent }}
          >
            <Stethoscope size={11} />
            OPD Queue
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
            Welcome to{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, ${accent}, #a78bfa)` }}
            >
              {clinicName}
            </span>
          </h1>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ── STEP: Doctor Selection ── */}
          {step === 'select-doctor' && (
            <motion.div
              key="step-select"
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <div
                className="w-full rounded-3xl p-6 flex flex-col gap-4"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(32px)',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                <div className="mb-1">
                  <h2 className="text-lg font-bold text-white">Select Your Doctor</h2>
                  <p className="text-sm text-zinc-400 mt-0.5">Choose the doctor you have an appointment with.</p>
                </div>

                {doctors.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <Stethoscope size={32} className="text-zinc-600" />
                    <p className="text-sm text-zinc-500">No doctors available at this clinic right now.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {doctors.map((doc) => (
                      <DoctorCard
                        key={doc.id}
                        doctor={doc}
                        isSelected={selectedDoctor?.id === doc.id}
                        onSelect={() => setSelectedDoctor(doc)}
                        accentColor={accent}
                      />
                    ))}
                  </div>
                )}

                {doctors.length > 0 && (
                  <motion.button
                    type="button"
                    onClick={() => { if (selectedDoctor) setStep('register'); }}
                    disabled={!selectedDoctor}
                    whileTap={{ scale: 0.96 }}
                    className="relative mt-2 w-full rounded-2xl py-4 text-base font-semibold text-white overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    style={{ background: selectedDoctor ? `linear-gradient(135deg, ${accent}, #7c3aed)` : 'rgba(255,255,255,0.08)' }}
                  >
                    {selectedDoctor ? (
                      <span className="flex items-center justify-center gap-2.5">
                        Continue with {selectedDoctor.full_name}
                        <ArrowRight size={18} />
                      </span>
                    ) : (
                      <span className="text-zinc-400">Select a doctor above</span>
                    )}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {/* ── STEP: Registration Form ── */}
          {step === 'register' && selectedDoctor && (
            <motion.form
              key="step-register"
              onSubmit={handleFormSubmit}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <div
                className="w-full rounded-3xl p-7 flex flex-col gap-5"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(32px)',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                <div className="bg-slate-800/50 rounded-xl p-4 mb-2 border border-slate-700">
                  <h3 className="text-sm font-semibold text-white mb-3">Welcome! Get your token in 3 easy steps:</h3>
                  <ul className="flex flex-col gap-3">
                    <li className="flex items-start gap-2 text-sm text-slate-400">
                      <User size={16} className="shrink-0 mt-0.5" />
                      <span>1. Enter your Name and WhatsApp Number below.</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-400">
                      <Wallet size={16} className="shrink-0 mt-0.5" />
                      <span>2. Choose how you want to pay.</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-400">
                      <Ticket size={16} className="shrink-0 mt-0.5" />
                      <span>3. Get your Live Queue Number instantly!</span>
                    </li>
                  </ul>
                </div>

                {/* doctor_id baked into FormData — authoritative source for the server action */}
                <input type="hidden" name="doctor_id" value={selectedDoctor.id} />

                {/* Selected doctor pill */}
                <div className="flex items-center gap-3">
                  {doctors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setStep('select-doctor')}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
                    >
                      ← Back
                    </button>
                  )}
                  <div
                    className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold flex-1 min-w-0"
                    style={{ background: `${accent}18`, border: `1px solid ${accent}33` }}
                  >
                    <Stethoscope size={12} style={{ color: accent }} />
                    <span className="text-zinc-300 truncate">{selectedDoctor.full_name}</span>
                    {selectedDoctor.queue_prefix && (
                      <span className="ml-auto shrink-0 font-mono font-bold" style={{ color: accent }}>
                        {selectedDoctor.queue_prefix}
                      </span>
                    )}
                    <CheckCircle2 size={12} style={{ color: accent }} />
                  </div>
                </div>
                <FloatingInput
                  id="patient-name"
                  name="patientName"
                  label="Full Name"
                  value={name}
                  onChange={setName}
                  icon={User}
                  disabled={isSubmitting}
                  accentColor={accent}
                />
                <div>
                  <FloatingInput
                    id="patient-phone"
                    name="phoneNumber"
                    label="WhatsApp Number"
                    type="tel"
                    value={phone}
                    onChange={setPhone}
                    icon={Phone}
                    disabled={isSubmitting}
                    accentColor={accent}
                  />
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                    <MessageCircle size={14} className="text-green-500/80 shrink-0" />
                    <span>We will send your live queue link and digital prescription here.</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-2 flex items-start gap-1.5">
                    <RefreshCcw size={14} className="shrink-0 mt-0.5" />
                    <span>Accidentally closed your tab? Enter the exact same phone number to instantly recover your live ticket.</span>
                  </p>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2 mt-1">
                  <label className="block text-xs font-medium text-slate-400 pl-1">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === 'cash'
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'cash')}
                        className="sr-only"
                      />
                      <span className="text-sm font-semibold">Pay at Clinic</span>
                    </label>
                    <label
                      className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === 'online'
                          ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'online')}
                        className="sr-only"
                      />
                      <span className="text-sm font-semibold">Pay Online Now</span>
                    </label>
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={!name.trim() || !phone.trim() || isSubmitting}
                  whileTap={{ scale: 0.96 }}
                  className="relative mt-2 w-full rounded-2xl py-4 text-base font-semibold text-white overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: `linear-gradient(135deg, ${accent}, #7c3aed)` }}
                >
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ boxShadow: `0 0 28px ${accent}88, 0 0 60px ${accent}44` }}
                  />
                  <motion.div
                    animate={{ x: ['-110%', '110%'] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.25) 50%, transparent 65%)' }}
                  />
                  <span className="relative flex items-center justify-center gap-2.5">
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white"
                        />
                        Generating Token…
                      </>
                    ) : (
                      <>Generate Token <ArrowRight size={18} /></>
                    )}
                  </span>
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-zinc-600 text-center"
        >
          Powered by <span className="text-zinc-400 font-medium">Opedox</span>
          {' '}· Your place in queue is reserved instantly.
        </motion.p>
      </div>
    </div>
  );
}