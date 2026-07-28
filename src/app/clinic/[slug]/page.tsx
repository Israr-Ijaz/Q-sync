'use client';

import { use, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Phone,
  ArrowRight,
  MapPin,
} from 'lucide-react';
// IMPORTANT: Make sure this import path matches where you saved your Server Action!
import { joinQueue } from '@/actions/patient';

// ─── Types ─────────────────────────────────────────────────────────────────
type PageProps = {
  params: Promise<{ slug: string }>;
};

// ─── Mock clinic data keyed by slug ────────────────────────────────────────
const CLINIC_DATA: Record<
  string,
  { name: string; tagline: string; city: string; accent: string }
> = {
  'sunrise-clinic': {
    name: 'Sunrise Clinic',
    tagline: 'Modern care, warmly delivered.',
    city: 'Lahore, PK',
    accent: '#6366f1',
  },
  'city-health': {
    name: 'City Health Centre',
    tagline: 'Your health, our mission.',
    city: 'Karachi, PK',
    accent: '#06b6d4',
  },
};

const DEFAULT_CLINIC = {
  name: 'QSync Clinic',
  tagline: 'Effortless patient management.',
  city: 'Pakistan',
  accent: '#8b5cf6',
};

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
      {/* Glow ring on focus */}
      {focused && (
        <motion.div
          key="glow"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow: `0 0 0 2px ${accentColor}66, 0 0 24px ${accentColor}33`,
          }}
        />
      )}

      {/* Icon */}
      <div
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors duration-200"
        style={{ color: focused ? accentColor : '#6b7280' }}
      >
        <Icon size={18} />
      </div>

      {/* Floating label */}
      <motion.label
        htmlFor={id}
        animate={{
          y: isFloated ? -10 : 0,
          x: isFloated ? 0 : 0,
          scale: isFloated ? 0.78 : 1,
          color: focused ? accentColor : isFloated ? '#9ca3af' : '#6b7280',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="absolute left-12 top-1/2 -translate-y-1/2 origin-left font-medium pointer-events-none z-10"
        style={{ fontSize: '0.9375rem' }}
      >
        {label}
      </motion.label>

      {/* Input */}
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

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function ClinicPage({ params }: PageProps) {
  const { slug } = use(params);
  const clinic = CLINIC_DATA[slug] ?? { ...DEFAULT_CLINIC, name: decodeURIComponent(slug.replace(/-/g, ' ')).replace(/\b\w/g, (c) => c.toUpperCase()) + ' Clinic', tagline: DEFAULT_CLINIC.tagline, city: DEFAULT_CLINIC.city, accent: DEFAULT_CLINIC.accent };

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const accent = clinic.accent;

  // The Server Action Handler
  const handleFormSubmit = async (formData: FormData) => {
    setIsSubmitting(true);

    // Call our Supabase Server Action
    const result = await joinQueue(formData, slug);

    // If it fails, show error and reset button
    if (result?.error) {
      alert(result.error);
      setIsSubmitting(false);
    } else if (result?.success) {
      // If it succeeds, navigate to the tracking ticket
      window.location.href = `/ticket/${result.tokenId}`;
    }
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center px-4 py-12"
      style={{ background: '#0a0a0f' }}
    >
      {/* ── Ambient background blobs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.18, 0.28, 0.18] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: `${accent}` }}
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

      {/* ── Perimeter edge glow ── */}
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

      {/* ─── FORM VIEW ─── */}
      <motion.form
        action={handleFormSubmit}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-[420px] flex flex-col items-center gap-8"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          {/* Clinic badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 text-xs font-semibold tracking-wider uppercase"
            style={{
              background: `${accent}22`,
              border: `1px solid ${accent}44`,
              color: accent,
            }}
          >
            <MapPin size={11} />
            {clinic.city}
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
            Welcome to{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, ${accent}, #a78bfa)` }}
            >
              {clinic.name}
            </span>
          </h1>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            {clinic.tagline}
            <br />
            Enter your details below to join the queue.
          </p>
        </motion.div>

        {/* Glassmorphic card */}
        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.28, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full rounded-3xl p-7 flex flex-col gap-5"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.10)',
            backdropFilter: 'blur(32px)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
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
          <FloatingInput
            id="patient-phone"
            name="phoneNumber"
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={setPhone}
            icon={Phone}
            disabled={isSubmitting}
            accentColor={accent}
          />

          {/* Submit button */}
          <motion.button
            ref={buttonRef}
            type="submit"
            disabled={!name.trim() || !phone.trim() || isSubmitting}
            whileTap={{ scale: 0.96 }}
            className="relative mt-2 w-full rounded-2xl py-4 text-base font-semibold text-white overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${accent}, #7c3aed)`,
            }}
          >
            {/* Continuous edge glow on button */}
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                boxShadow: `0 0 28px ${accent}88, 0 0 60px ${accent}44`,
              }}
            />
            {/* Shimmer sweep */}
            <motion.div
              animate={{ x: ['-110%', '110%'] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.25) 50%, transparent 65%)',
              }}
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
                <>
                  Generate Token
                  <ArrowRight size={18} />
                </>
              )}
            </span>
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-zinc-600 text-center"
        >
          Powered by{' '}
          <span className="text-zinc-400 font-medium">QSync</span>
          {' '}· Your place in queue is reserved instantly.
        </motion.p>
      </motion.form>
    </div>
  );
}